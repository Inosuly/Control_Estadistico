"use client"

import type React from "react"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Calculator, BarChart3, PieChartIcon, Activity, Plus, Minus } from "lucide-react"

// Interfaces
interface FrequencyData {
  value: number
  frequency: number
  relativeFreq: number
  cumulativeFreq: number
  cumulativeRelativeFreq: number
}

interface GroupedFrequencyData {
  class: string
  lowerLimit: number
  upperLimit: number
  classmark: number
  frequency: number
  relativeFreq: number
  cumulativeFreq: number
  cumulativeRelativeFreq: number
}

interface GroupedStatistics {
  totalData: number
  maxValue: number
  minValue: number
  range: number
  classWidth: number
  numberOfClasses: number
}

interface Statistics {
  mean: number
  median: number
  mode: number[]
  variance: number
  standardDeviation: number
  skewness: number
  standardizedSkewness: number
  kurtosis: number
}

interface XRData {
  subgroups: number[][]
  xBar: number[]
  rValues: number[]
  xBarBar: number
  rBar: number
  uclX: number
  lclX: number
  uclR: number
  lclR: number
  sigmaX: number
  sigmaR: number
}

interface BoxPlotData {
  min: number
  q1: number
  median: number
  q3: number
  max: number
  outliers: number[]
  iqr: number
}

// Error Boundary Component
function ErrorBoundary({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const handleError = () => setHasError(true)
    window.addEventListener("error", handleError)
    return () => window.removeEventListener("error", handleError)
  }, [])

  if (hasError) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export default function Component() {
  // Estados principales
  const [dataType, setDataType] = useState<"ungrouped" | "grouped" | "xr-charts">("ungrouped")
  const [sampleType, setSampleType] = useState<"sample" | "population">("sample")
  const [inputData, setInputData] = useState("")
  const [processedData, setProcessedData] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [activeChart, setActiveChart] = useState<string | null>(null)
  const [groupedStats, setGroupedStats] = useState<GroupedStatistics | null>(null)
  const [xrData, setXrData] = useState<XRData | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Estados para X-R Charts
  const [xrTableData, setXrTableData] = useState<number[][]>([])
  const [xrRows, setXrRows] = useState(5)
  const [xrCols, setXrCols] = useState(5)
  const [excelData, setExcelData] = useState("")
  const [inputMethod, setInputMethod] = useState<"table" | "excel">("table")
  const [showExcelPreview, setShowExcelPreview] = useState(false)

  // Estados de vista previa
  const [showPreview, setShowPreview] = useState(false)
  const [previewXRData, setPreviewXRData] = useState<number[][]>([])

  // Efecto para detectar cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Función para validar entrada numérica
  const validateNumericInput = useCallback((input: string): boolean => {
    try {
      const trimmed = input.trim()
      if (trimmed === "") return false
      const num = Number.parseFloat(trimmed)
      return !isNaN(num) && isFinite(num)
    } catch {
      return false
    }
  }, [])

  // Función para procesar y confirmar datos
  const confirmAndProcess = useCallback(() => {
    try {
      if (dataType === "xr-charts") {
        if (!Array.isArray(previewXRData) || previewXRData.length === 0) {
          // Procesar datos de la tabla X-R
          const validSubgroups = xrTableData
            .filter(
              (row) => Array.isArray(row) && row.some((val) => typeof val === "number" && !isNaN(val) && val !== 0),
            )
            .map((row) => row.filter((val) => typeof val === "number" && !isNaN(val)))

          if (validSubgroups.length === 0) {
            alert("Por favor ingrese datos válidos en la tabla X-R")
            return
          }
          calculateXRData(validSubgroups)
        } else {
          calculateXRData(previewXRData)
        }
        setShowResults(true)
        setActiveChart(null)
        setShowPreview(false)
        return
      }

      const inputValues = inputData
        .split(/[,\s\n\t]+/)
        .map((str) => str.trim())
        .filter((str) => str !== "")

      const invalidValues = inputValues.filter((val) => !validateNumericInput(val))
      if (invalidValues.length > 0) {
        alert(`Los siguientes valores no son números válidos: ${invalidValues.join(", ")}`)
        return
      }

      const numbers = inputValues.map((str) => Number.parseFloat(str))

      if (numbers.length === 0) {
        alert("Por favor ingrese datos válidos")
        return
      }

      setProcessedData(numbers)

      if (dataType === "grouped") {
        const totalData = numbers.length
        const maxValue = Math.max(...numbers)
        const minValue = Math.min(...numbers)
        const range = maxValue - minValue
        const numberOfClasses = Math.round(1 + 3.322 * Math.log10(totalData))
        const classWidth = range / numberOfClasses

        setGroupedStats({
          totalData,
          maxValue,
          minValue,
          range: Math.round(range * 1000) / 1000,
          classWidth: Math.round(classWidth * 1000) / 1000,
          numberOfClasses,
        })
      } else {
        setGroupedStats(null)
      }

      setShowResults(true)
      setActiveChart(null)
      setXrData(null)
    } catch (error) {
      console.error("Error al procesar datos:", error)
      alert("Error al procesar los datos.")
    }
  }, [dataType, previewXRData, xrTableData, inputData, validateNumericInput])

  // Función para calcular datos X-R
  const calculateXRData = useCallback((subgroups: number[][]) => {
    try {
      if (!Array.isArray(subgroups) || subgroups.length === 0) return

      const xBar = subgroups.map((subgroup) => {
        if (!Array.isArray(subgroup) || subgroup.length === 0) return 0
        return subgroup.reduce((sum, val) => sum + (val || 0), 0) / subgroup.length
      })

      const rValues = subgroups.map((subgroup) => {
        if (!Array.isArray(subgroup) || subgroup.length === 0) return 0
        return Math.max(...subgroup) - Math.min(...subgroup)
      })

      const xBarBar = xBar.reduce((sum, val) => sum + (val || 0), 0) / xBar.length
      const rBar = rValues.reduce((sum, val) => sum + (val || 0), 0) / rValues.length

      const n = subgroups[0]?.length || 5
      const factors: { [key: number]: { A2: number; D3: number; D4: number } } = {
        2: { A2: 1.88, D3: 0, D4: 3.267 },
        3: { A2: 1.023, D3: 0, D4: 2.574 },
        4: { A2: 0.729, D3: 0, D4: 2.282 },
        5: { A2: 0.577, D3: 0, D4: 2.114 },
        6: { A2: 0.483, D3: 0, D4: 2.004 },
        7: { A2: 0.419, D3: 0.076, D4: 1.924 },
        8: { A2: 0.373, D3: 0.136, D4: 1.864 },
        9: { A2: 0.337, D3: 0.184, D4: 1.816 },
        10: { A2: 0.308, D3: 0.223, D4: 1.777 },
      }

      const { A2, D3, D4 } = factors[n] || factors[5]

      const newXrData: XRData = {
        subgroups,
        xBar,
        rValues,
        xBarBar,
        rBar,
        uclX: xBarBar + A2 * rBar,
        lclX: xBarBar - A2 * rBar,
        uclR: D4 * rBar,
        lclR: D3 * rBar,
        sigmaX: rBar / (n === 2 ? 1.128 : n === 3 ? 1.693 : n === 4 ? 2.059 : 2.326),
        sigmaR: rBar,
      }

      setXrData(newXrData)
    } catch (error) {
      console.error("Error calculando datos X-R:", error)
    }
  }, [])

  // Función para procesar datos de Excel
  const processExcelData = useCallback(() => {
    try {
      const lines = excelData.trim().split("\n")
      const newTableData: number[][] = []
      const invalidValues: string[] = []

      lines.forEach((line, lineIndex) => {
        const values = line.split(/[\t,]/).map((val, colIndex) => {
          const trimmed = val.trim()
          if (trimmed === "") return 0

          if (!validateNumericInput(trimmed)) {
            invalidValues.push(`Fila ${lineIndex + 1}, Columna ${colIndex + 1}: "${trimmed}"`)
            return 0
          }

          return Number.parseFloat(trimmed)
        })
        if (values.length > 0) {
          newTableData.push(values)
        }
      })

      if (invalidValues.length > 0) {
        alert(`Se encontraron valores no numéricos que fueron convertidos a 0:\n${invalidValues.join("\n")}`)
      }

      if (newTableData.length > 0) {
        const maxCols = Math.min(Math.max(...newTableData.map((row) => row.length)), 20)
        const normalizedData = newTableData.map((row) => {
          const normalizedRow = [...row]
          while (normalizedRow.length < maxCols) {
            normalizedRow.push(0)
          }
          return normalizedRow.slice(0, maxCols)
        })

        setXrTableData(normalizedData)
        setXrRows(normalizedData.length)
        setXrCols(maxCols)
        setShowExcelPreview(true)

        const validSubgroups = normalizedData
          .filter((row) => Array.isArray(row) && row.some((val) => typeof val === "number" && !isNaN(val) && val !== 0))
          .map((row) => row.filter((val) => typeof val === "number" && !isNaN(val)))

        if (validSubgroups.length > 0) {
          calculateXRData(validSubgroups)
          setShowResults(true)
          setActiveChart(null)
          alert(
            `Datos procesados: ${normalizedData.length} filas, ${maxCols} columnas\nResultados X-R generados automáticamente.`,
          )
        }
      }
    } catch (error) {
      console.error("Error procesando datos de Excel:", error)
      alert("Error al procesar los datos de Excel.")
    }
  }, [excelData, validateNumericInput, calculateXRData])

  // Función para actualizar celda X-R
  const updateXRCell = useCallback(
    (row: number, col: number, value: string) => {
      try {
        if (value === "") {
          const newTable = [...xrTableData]
          if (!newTable[row]) {
            while (newTable.length <= row) {
              newTable.push(Array(xrCols).fill(0))
            }
          }
          newTable[row][col] = 0
          setXrTableData(newTable)
          return
        }

        if (!validateNumericInput(value)) {
          return
        }

        const numValue = Number.parseFloat(value)
        const newTable = [...xrTableData]

        if (!newTable[row]) {
          while (newTable.length <= row) {
            newTable.push(Array(xrCols).fill(0))
          }
        }

        newTable[row][col] = numValue
        setXrTableData(newTable)
      } catch (error) {
        console.error("Error actualizando celda:", error)
      }
    },
    [xrTableData, xrCols, validateNumericInput],
  )

  // Inicializar tabla X-R
  const initializeXRTable = useCallback(() => {
    try {
      const initialData: number[][] = Array(xrRows)
        .fill(null)
        .map(() => Array(xrCols).fill(0))
      setXrTableData(initialData)
    } catch (error) {
      console.error("Error inicializando tabla:", error)
    }
  }, [xrRows, xrCols])

  // Efecto para inicializar tabla X-R
  useEffect(() => {
    if (dataType === "xr-charts" && xrTableData.length === 0) {
      initializeXRTable()
    }
  }, [dataType, initializeXRTable, xrTableData.length])

  // Calcular tabla de frecuencias con manejo de errores
  const frequencyTable = useMemo((): FrequencyData[] => {
    try {
      if (!Array.isArray(processedData) || processedData.length === 0) return []

      const frequencyMap = new Map<number, number>()
      processedData.forEach((value) => {
        if (typeof value === "number" && !isNaN(value)) {
          frequencyMap.set(value, (frequencyMap.get(value) || 0) + 1)
        }
      })

      const total = processedData.length
      let cumulativeFreq = 0
      let cumulativeRelativeFreq = 0

      return Array.from(frequencyMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([value, frequency]) => {
          const relativeFreq = frequency / total
          cumulativeFreq += frequency
          cumulativeRelativeFreq += relativeFreq

          return {
            value,
            frequency,
            relativeFreq: Math.round(relativeFreq * 10000) / 100,
            cumulativeFreq,
            cumulativeRelativeFreq: Math.round(cumulativeRelativeFreq * 10000) / 100,
          }
        })
    } catch (error) {
      console.error("Error calculando tabla de frecuencias:", error)
      return []
    }
  }, [processedData])

  // Calcular estadísticas con manejo de errores
  const statistics = useMemo((): Statistics => {
    try {
      if (!Array.isArray(processedData) || processedData.length === 0) {
        return {
          mean: 0,
          median: 0,
          mode: [],
          variance: 0,
          standardDeviation: 0,
          skewness: 0,
          standardizedSkewness: 0,
          kurtosis: 0,
        }
      }

      const validData = processedData.filter((val) => typeof val === "number" && !isNaN(val))
      if (validData.length === 0) {
        return {
          mean: 0,
          median: 0,
          mode: [],
          variance: 0,
          standardDeviation: 0,
          skewness: 0,
          standardizedSkewness: 0,
          kurtosis: 0,
        }
      }

      const sorted = [...validData].sort((a, b) => a - b)
      const n = validData.length

      const mean = validData.reduce((sum, val) => sum + val, 0) / n
      const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)]

      const frequencyMap = new Map<number, number>()
      validData.forEach((value) => {
        frequencyMap.set(value, (frequencyMap.get(value) || 0) + 1)
      })

      const maxFreq = Math.max(...frequencyMap.values())
      const mode = Array.from(frequencyMap.entries())
        .filter(([, freq]) => freq === maxFreq)
        .map(([value]) => value)

      const variance =
        validData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (sampleType === "sample" ? n - 1 : n)
      const standardDeviation = Math.sqrt(variance)

      const m3 = validData.reduce((sum, val) => sum + Math.pow(val - mean, 3), 0) / n
      const skewness = standardDeviation > 0 ? m3 / Math.pow(standardDeviation, 3) : 0

      const standardizedSkewness = n > 0 ? skewness / Math.sqrt(6 / n) : 0

      const m4 = validData.reduce((sum, val) => sum + Math.pow(val - mean, 4), 0) / n
      const kurtosis = standardDeviation > 0 ? m4 / Math.pow(standardDeviation, 4) - 3 : 0

      return {
        mean: Math.round(mean * 10000) / 10000,
        median: Math.round(median * 10000) / 10000,
        mode,
        variance: Math.round(variance * 10000) / 10000,
        standardDeviation: Math.round(standardDeviation * 10000) / 10000,
        skewness: Math.round(skewness * 10000) / 10000,
        standardizedSkewness: Math.round(standardizedSkewness * 10000) / 10000,
        kurtosis: Math.round(kurtosis * 10000) / 10000,
      }
    } catch (error) {
      console.error("Error calculando estadísticas:", error)
      return {
        mean: 0,
        median: 0,
        mode: [],
        variance: 0,
        standardDeviation: 0,
        skewness: 0,
        standardizedSkewness: 0,
        kurtosis: 0,
      }
    }
  }, [processedData, sampleType])

  // Función para resetear datos
  const resetData = useCallback(() => {
    try {
      setInputData("")
      setProcessedData([])
      setShowResults(false)
      setActiveChart(null)
      setXrData(null)
      setXrTableData([])
      setShowExcelPreview(false)
      setExcelData("")
      setShowPreview(false)
      setPreviewXRData([])
    } catch (error) {
      console.error("Error reseteando datos:", error)
    }
  }, [])

  // Funciones para manejar filas y columnas X-R
  const addXRRow = useCallback(() => {
    setXrRows((prev) => prev + 1)
    setXrTableData((prev) => [...prev, Array(xrCols).fill(0)])
  }, [xrCols])

  const removeXRRow = useCallback(() => {
    if (xrRows > 1) {
      setXrRows((prev) => prev - 1)
      setXrTableData((prev) => prev.slice(0, -1))
    }
  }, [xrRows])

  const addXRCol = useCallback(() => {
    if (xrCols < 20) {
      setXrCols((prev) => prev + 1)
      setXrTableData((prev) => prev.map((row) => [...row, 0]))
    }
  }, [xrCols])

  const removeXRCol = useCallback(() => {
    if (xrCols > 1) {
      setXrCols((prev) => prev - 1)
      setXrTableData((prev) => prev.map((row) => row.slice(0, -1)))
    }
  }, [xrCols])

  // Si no estamos en el cliente, mostrar loading
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <Calculator className="h-12 w-12 mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Cargando Control Estadístico...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-4 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-red-600">Error al cargar la aplicación. Por favor, recargue la página.</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Recargar
            </Button>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <Card>
            <CardHeader className="text-center p-4 sm:p-6">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
                <Calculator className="h-6 w-6 sm:h-8 sm:w-8" />
                Control Estadístico
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Análisis estadístico completo con tablas de frecuencia y gráficas
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Input Section */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Entrada de Datos</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {dataType === "xr-charts"
                  ? "Configure la tabla para análisis de gráficos X-R (máximo 20 columnas, filas ilimitadas)"
                  : "Ingrese los datos separados por comas, espacios, tabulaciones o saltos de línea"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              {/* Data Type Selection */}
              <div>
                <Label className="text-sm sm:text-base">Tipo de análisis:</Label>
                <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mt-2">
                  <Button
                    variant={dataType === "ungrouped" ? "default" : "outline"}
                    onClick={() => setDataType("ungrouped")}
                    className="px-3 sm:px-6 text-xs sm:text-sm"
                    size="sm"
                  >
                    Datos No Agrupados
                  </Button>
                  <Button
                    variant={dataType === "grouped" ? "default" : "outline"}
                    onClick={() => setDataType("grouped")}
                    className="px-3 sm:px-6 text-xs sm:text-sm"
                    size="sm"
                  >
                    Datos Agrupados
                  </Button>
                  <Button
                    variant={dataType === "xr-charts" ? "default" : "outline"}
                    onClick={() => {
                      setDataType("xr-charts")
                      if (xrTableData.length === 0) {
                        initializeXRTable()
                      }
                    }}
                    className="px-3 sm:px-6 text-xs sm:text-sm"
                    size="sm"
                  >
                    Gráficos X-R
                  </Button>
                </div>
              </div>

              {dataType !== "xr-charts" ? (
                // Regular Data Input
                <>
                  <div>
                    <Label htmlFor="data-input" className="text-sm sm:text-base">
                      Datos:
                    </Label>
                    <Textarea
                      id="data-input"
                      placeholder="Ejemplo: 1, 2, -3.5, 4.2, 5 o ingrese cada valor en una línea nueva. También puede separar por tabulaciones si copia desde Excel."
                      value={inputData}
                      onChange={(e) => setInputData(e.target.value)}
                      className="min-h-[80px] sm:min-h-[100px] text-sm"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      <strong>Formatos aceptados:</strong> Separación por comas (1,2,3), espacios (1 2 3), tabulaciones
                      (copiar desde Excel), o saltos de línea
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm sm:text-base">Tipo de datos:</Label>
                    <RadioGroup
                      value={sampleType}
                      onValueChange={(value: "sample" | "population") => setSampleType(value)}
                      className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sample" id="sample" />
                        <Label htmlFor="sample" className="text-sm sm:text-base">
                          Muestrales
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="population" id="population" />
                        <Label htmlFor="population" className="text-sm sm:text-base">
                          Poblacionales
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              ) : (
                // X-R Table Input
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm sm:text-base">Método de entrada:</Label>
                    <div className="flex gap-2 sm:gap-4 mt-2">
                      <Button
                        variant={inputMethod === "table" ? "default" : "outline"}
                        onClick={() => setInputMethod("table")}
                        size="sm"
                        className="text-xs sm:text-sm"
                      >
                        Tabla Manual
                      </Button>
                      <Button
                        variant={inputMethod === "excel" ? "default" : "outline"}
                        onClick={() => setInputMethod("excel")}
                        size="sm"
                        className="text-xs sm:text-sm"
                      >
                        Copiar de Excel
                      </Button>
                    </div>
                  </div>

                  {inputMethod === "excel" ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="excel-data" className="text-sm sm:text-base">
                          Datos de Excel (copie y pegue desde Excel):
                        </Label>
                        <Textarea
                          id="excel-data"
                          placeholder="Copie los datos desde Excel y péguelos aquí. Cada fila debe estar en una línea nueva y las columnas separadas por tabulaciones o comas."
                          value={excelData}
                          onChange={(e) => setExcelData(e.target.value)}
                          className="min-h-[120px] sm:min-h-[150px] font-mono text-xs sm:text-sm"
                        />
                      </div>
                      <Button onClick={processExcelData} variant="outline" className="w-full text-sm">
                        Procesar Datos de Excel y Generar X-R
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Filas:</Label>
                          <Button size="sm" variant="outline" onClick={removeXRRow} disabled={xrRows <= 1}>
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <span className="w-8 sm:w-10 text-center text-sm">{xrRows}</span>
                          <Button size="sm" variant="outline" onClick={addXRRow}>
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Columnas:</Label>
                          <Button size="sm" variant="outline" onClick={removeXRCol} disabled={xrCols <= 1}>
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <span className="w-8 sm:w-10 text-center text-sm">{xrCols}</span>
                          <Button size="sm" variant="outline" onClick={addXRCol} disabled={xrCols >= 20}>
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <span className="text-xs text-gray-500">(máx: 20)</span>
                        </div>
                      </div>

                      <div className="overflow-x-auto border rounded-lg max-h-96">
                        <table className="w-full min-w-max">
                          <thead className="sticky top-0 bg-gray-50">
                            <tr>
                              <th className="p-1 sm:p-2 border-r font-medium text-xs sm:text-sm sticky left-0 bg-gray-50">
                                Subgrupo
                              </th>
                              {Array.from({ length: xrCols }, (_, i) => (
                                <th key={i} className="p-1 sm:p-2 border-r font-medium text-xs sm:text-sm">
                                  X{i + 1}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: xrRows }, (_, rowIndex) => (
                              <tr key={rowIndex} className="border-t">
                                <td className="p-1 sm:p-2 border-r font-medium bg-gray-50 text-center text-xs sm:text-sm sticky left-0">
                                  {rowIndex + 1}
                                </td>
                                {Array.from({ length: xrCols }, (_, colIndex) => (
                                  <td key={colIndex} className="p-1 border-r">
                                    <Input
                                      type="number"
                                      step="any"
                                      value={xrTableData[rowIndex]?.[colIndex] || 0}
                                      onChange={(e) => updateXRCell(rowIndex, colIndex, e.target.value)}
                                      className="w-full text-center border-0 focus:ring-1 text-xs sm:text-sm h-8 sm:h-10"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Button onClick={confirmAndProcess} className="flex-1 text-sm">
                  Procesar Datos
                </Button>
                <Button variant="outline" onClick={resetData} className="text-sm">
                  Limpiar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {showResults && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  {dataType === "xr-charts" ? "Estadísticas de Control X-R" : "Estadísticas Descriptivas"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {dataType === "xr-charts" && xrData ? (
                  // X-R Results
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-blue-600">{xrData.xBarBar.toFixed(5)}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Media de Medias (X̄̄)</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-green-600">{xrData.rBar.toFixed(5)}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Media de Rangos (R̄)</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold mb-2 text-sm sm:text-base">Generar Gráficas de Control:</h4>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={activeChart === "xbar" ? "default" : "outline"}
                          onClick={() => setActiveChart(activeChart === "xbar" ? null : "xbar")}
                          size="sm"
                          className="text-xs sm:text-sm"
                        >
                          <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Gráfica X̄
                        </Button>
                        <Button
                          variant={activeChart === "r" ? "default" : "outline"}
                          onClick={() => setActiveChart(activeChart === "r" ? null : "r")}
                          size="sm"
                          className="text-xs sm:text-sm"
                        >
                          <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Gráfica R
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Regular Statistics
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-blue-600">{statistics.mean}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Media</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-green-600">{statistics.median}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Mediana</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-purple-600">
                          {Array.isArray(statistics.mode) && statistics.mode.length === 1
                            ? statistics.mode[0]
                            : "Múltiple"}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Moda</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-orange-600">{statistics.variance}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Varianza</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold mb-2 text-sm sm:text-base">Gráficas Básicas:</h4>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={activeChart === "frequency" ? "default" : "outline"}
                          onClick={() => setActiveChart(activeChart === "frequency" ? null : "frequency")}
                          size="sm"
                          className="text-xs sm:text-sm"
                        >
                          <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Frecuencia
                        </Button>
                        <Button
                          variant={activeChart === "pie" ? "default" : "outline"}
                          onClick={() => setActiveChart(activeChart === "pie" ? null : "pie")}
                          size="sm"
                          className="text-xs sm:text-sm"
                        >
                          <PieChartIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Gráfica Circular
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Charts */}
          {activeChart && showResults && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  {activeChart === "frequency" && "Gráfica de Frecuencias"}
                  {activeChart === "pie" && "Gráfica Circular"}
                  {activeChart === "xbar" && "Gráfica de Control X̄ (Medias)"}
                  {activeChart === "r" && "Gráfica de Control R (Rangos)"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {activeChart === "frequency" && Array.isArray(frequencyTable) && frequencyTable.length > 0 && (
                      <BarChart
                        data={frequencyTable.map((item) => ({
                          value: item.value.toString(),
                          frequency: item.frequency,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="value" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="frequency" fill="#3b82f6" />
                      </BarChart>
                    )}
                    {activeChart === "pie" && Array.isArray(frequencyTable) && frequencyTable.length > 0 && (
                      <PieChart>
                        <Pie
                          data={frequencyTable.map((item, index) => ({
                            name: item.value.toString(),
                            value: item.frequency,
                            fill: `hsl(${(index * 360) / frequencyTable.length}, 70%, 50%)`,
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {frequencyTable.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={`hsl(${(index * 360) / frequencyTable.length}, 70%, 50%)`}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    )}
                    {activeChart === "xbar" && xrData && Array.isArray(xrData.xBar) && (
                      <LineChart
                        data={xrData.xBar.map((val, index) => ({
                          subgroup: index + 1,
                          value: Number((val || 0).toFixed(2)),
                          LCS: Number(xrData.uclX.toFixed(2)),
                          LCI: Number(xrData.lclX.toFixed(2)),
                          LC: Number(xrData.xBarBar.toFixed(2)),
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subgroup" />
                        <YAxis />
                        <Tooltip formatter={(value, name) => [Number(value).toFixed(2), name]} />
                        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
                        <Line type="monotone" dataKey="LCS" stroke="#dc2626" strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="LCI" stroke="#dc2626" strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="LC" stroke="#16a34a" strokeDasharray="3 3" />
                      </LineChart>
                    )}
                    {activeChart === "r" && xrData && Array.isArray(xrData.rValues) && (
                      <LineChart
                        data={xrData.rValues.map((val, index) => ({
                          subgroup: index + 1,
                          value: Number((val || 0).toFixed(2)),
                          LCS: Number(xrData.uclR.toFixed(2)),
                          LCI: Number(xrData.lclR.toFixed(2)),
                          LC: Number(xrData.rBar.toFixed(2)),
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subgroup" />
                        <YAxis />
                        <Tooltip formatter={(value, name) => [Number(value).toFixed(2), name]} />
                        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
                        <Line type="monotone" dataKey="LCS" stroke="#dc2626" strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="LCI" stroke="#dc2626" strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="LC" stroke="#16a34a" strokeDasharray="3 3" />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}
