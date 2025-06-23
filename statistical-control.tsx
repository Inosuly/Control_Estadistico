"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  AreaChart,
  Area,
} from "recharts"
import { Calculator, BarChart3, TrendingUp, PieChartIcon, Activity, Package, Plus, Minus } from "lucide-react"

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

export default function Component() {
  const [dataType, setDataType] = useState<"ungrouped" | "grouped" | "xr-charts">("ungrouped")
  const [sampleType, setSampleType] = useState<"sample" | "population">("sample")
  const [inputData, setInputData] = useState("")
  const [processedData, setProcessedData] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [activeChart, setActiveChart] = useState<string | null>(null)
  const [groupedStats, setGroupedStats] = useState<GroupedStatistics | null>(null)
  const [xrData, setXrData] = useState<XRData | null>(null)

  // X-R Charts specific states
  const [xrTableData, setXrTableData] = useState<number[][]>([])
  const [xrRows, setXrRows] = useState(5)
  const [xrCols, setXrCols] = useState(5)
  const [excelData, setExcelData] = useState("")
  const [inputMethod, setInputMethod] = useState<"table" | "excel">("table")
  const [showExcelPreview, setShowExcelPreview] = useState(false)

  // Preview states
  const [showPreview, setShowPreview] = useState(false)
  const [previewXRData, setPreviewXRData] = useState<number[][]>([])

  // Función para validar entrada numérica
  const validateNumericInput = (input: string): boolean => {
    const trimmed = input.trim()
    if (trimmed === "") return false
    const num = Number.parseFloat(trimmed)
    return !isNaN(num) && isFinite(num)
  }

  // Parse and preview data
  const parseAndPreview = () => {
    try {
      if (dataType === "xr-charts") {
        // Process X-R table data for preview
        const validSubgroups = xrTableData
          .filter((row) => Array.isArray(row) && row.some((val) => !isNaN(val) && val !== 0))
          .map((row) => row.filter((val) => !isNaN(val)))

        if (validSubgroups.length === 0) {
          alert("Por favor ingrese datos válidos en la tabla X-R")
          return
        }

        setPreviewXRData(validSubgroups)
        setShowPreview(true)
        return
      }
    } catch (error) {
      alert("Error al procesar los datos. Verifique que solo contengan números válidos.")
    }
  }

  // Confirm and process the previewed data
  const confirmAndProcess = () => {
    try {
      if (dataType === "xr-charts") {
        calculateXRData(previewXRData)
        setShowResults(true)
        setActiveChart(null)
        setShowPreview(false)
        return
      }

      const inputValues = inputData
        .split(/[,\s\n\t]+/)
        .map((str) => str.trim())
        .filter((str) => str !== "")

      // Validar que todos los valores sean numéricos
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

      // Calcular estadísticas para datos agrupados
      if (dataType === "grouped") {
        const totalData = numbers.length
        const maxValue = Math.max(...numbers)
        const minValue = Math.min(...numbers)
        const range = maxValue - minValue

        // Regla de Sturges para número de clases
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
      alert("Error al procesar los datos.")
    }
  }

  const calculateXRData = (subgroups: number[][]) => {
    if (!Array.isArray(subgroups) || subgroups.length === 0) return

    // Calcular medias y rangos
    const xBar = subgroups.map((subgroup) => {
      if (!Array.isArray(subgroup) || subgroup.length === 0) return 0
      return subgroup.reduce((sum, val) => sum + val, 0) / subgroup.length
    })

    const rValues = subgroups.map((subgroup) => {
      if (!Array.isArray(subgroup) || subgroup.length === 0) return 0
      return Math.max(...subgroup) - Math.min(...subgroup)
    })

    // Calcular límites de control
    const xBarBar = xBar.reduce((sum, val) => sum + val, 0) / xBar.length
    const rBar = rValues.reduce((sum, val) => sum + val, 0) / rValues.length

    // Factores para límites de control (para diferentes tamaños de subgrupo)
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
  }

  const calculateBoxPlotData = (): BoxPlotData => {
    if (!Array.isArray(processedData) || processedData.length === 0)
      return {
        min: 0,
        q1: 0,
        median: 0,
        q3: 0,
        max: 0,
        outliers: [],
        iqr: 0,
      }

    const sorted = [...processedData].sort((a, b) => a - b)
    const n = sorted.length

    const q1Index = Math.floor(n * 0.25)
    const medianIndex = Math.floor(n * 0.5)
    const q3Index = Math.floor(n * 0.75)

    const q1 = sorted[q1Index]
    const median = n % 2 === 0 ? (sorted[medianIndex - 1] + sorted[medianIndex]) / 2 : sorted[medianIndex]
    const q3 = sorted[q3Index]
    const iqr = q3 - q1

    const lowerFence = q1 - 1.5 * iqr
    const upperFence = q3 + 1.5 * iqr

    const outliers = sorted.filter((val) => val < lowerFence || val > upperFence)
    const nonOutliers = sorted.filter((val) => val >= lowerFence && val <= upperFence)

    return {
      min: Math.min(...nonOutliers),
      q1,
      median,
      q3,
      max: Math.max(...nonOutliers),
      outliers,
      iqr,
    }
  }

  // Update X-R table cell with validation
  const updateXRCell = (row: number, col: number, value: string) => {
    // Si el valor está vacío, permitir
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

    // Validar que sea un número
    if (!validateNumericInput(value)) {
      return // No actualizar si no es un número válido
    }

    const numValue = Number.parseFloat(value)

    if (!xrTableData[row]) {
      const newTable = [...xrTableData]
      while (newTable.length <= row) {
        newTable.push(Array(xrCols).fill(0))
      }
      newTable[row][col] = numValue
      setXrTableData(newTable)
    } else {
      const newTable = [...xrTableData]
      newTable[row][col] = numValue
      setXrTableData(newTable)
    }
  }

  const processExcelData = () => {
    try {
      const lines = excelData.trim().split("\n")
      const newTableData: number[][] = []
      const invalidValues: string[] = []

      lines.forEach((line, lineIndex) => {
        // Acepta separación por tabulaciones Y comas
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
        // Limitar a máximo 20 columnas
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

        // Procesar automáticamente los datos X-R
        const validSubgroups = normalizedData
          .filter((row) => Array.isArray(row) && row.some((val) => !isNaN(val) && val !== 0))
          .map((row) => row.filter((val) => !isNaN(val)))

        if (validSubgroups.length > 0) {
          calculateXRData(validSubgroups)
          setShowResults(true)
          setActiveChart(null)
          alert(
            `Datos procesados: ${normalizedData.length} filas, ${maxCols} columnas (máximo 20)\nResultados X-R generados automáticamente.`,
          )
        } else {
          alert(`Datos importados: ${normalizedData.length} filas, ${maxCols} columnas (máximo 20)`)
        }
      } else {
        alert("No se pudieron procesar los datos. Verifique el formato.")
      }
    } catch (error) {
      alert("Error al procesar los datos de Excel. Verifique el formato.")
    }
  }

  // Add/Remove rows and columns for X-R table
  const addXRRow = () => {
    setXrRows((prev) => prev + 1)
    setXrTableData((prev) => [...prev, Array(xrCols).fill(0)])
  }

  const removeXRRow = () => {
    if (xrRows > 1) {
      setXrRows((prev) => prev - 1)
      setXrTableData((prev) => prev.slice(0, -1))
    }
  }

  const addXRCol = () => {
    if (xrCols < 20) {
      setXrCols((prev) => prev + 1)
      setXrTableData((prev) => prev.map((row) => [...row, 0]))
    }
  }

  const removeXRCol = () => {
    if (xrCols > 1) {
      setXrCols((prev) => prev - 1)
      setXrTableData((prev) => prev.map((row) => row.slice(0, -1)))
    }
  }

  // Add multiple rows at once
  const addMultipleXRRows = (count: number) => {
    setXrRows((prev) => prev + count)
    setXrTableData((prev) => {
      const newRows = Array(count)
        .fill(null)
        .map(() => Array(xrCols).fill(0))
      return [...prev, ...newRows]
    })
  }

  // Initialize table when switching to X-R charts
  const initializeXRTable = () => {
    const initialData: number[][] = Array(xrRows)
      .fill(null)
      .map(() => Array(xrCols).fill(0))
    setXrTableData(initialData)
  }

  useEffect(() => {
    if (dataType === "xr-charts" && xrTableData.length === 0) {
      initializeXRTable()
    }
  }, [dataType, xrCols, xrRows])

  // Calcular tabla de frecuencias
  const frequencyTable = useMemo((): FrequencyData[] => {
    if (!Array.isArray(processedData) || processedData.length === 0) return []

    const frequencyMap = new Map<number, number>()
    processedData.forEach((value) => {
      frequencyMap.set(value, (frequencyMap.get(value) || 0) + 1)
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
  }, [processedData])

  // Calcular tabla de frecuencias agrupadas
  const groupedFrequencyTable = useMemo((): GroupedFrequencyData[] => {
  if (
    !Array.isArray(processedData) || 
    processedData.length === 0 || 
    !groupedStats || 
    dataType !== "grouped" ||
    groupedStats.numberOfClasses <= 0 // Añadir esta validación
  ) return [];

    const { minValue, maxValue, numberOfClasses } = groupedStats
    const total = processedData.length
    const intervals: GroupedFrequencyData[] = []

    // Calcular el rango real y la amplitud de clase
    const realRange = maxValue - minValue
    const classWidth = realRange / numberOfClasses

    let cumulativeFreq = 0
    let cumulativeRelativeFreq = 0

    for (let i = 0; i < numberOfClasses; i++) {
      let lowerLimit: number
      let upperLimit: number

      if (i === 0) {
        // Primera clase: Li es el valor mínimo
        lowerLimit = minValue
        upperLimit = lowerLimit + classWidth
      } else if (i === numberOfClasses - 1) {
        // Última clase: Ls es el valor máximo
        lowerLimit = minValue + i * classWidth
        upperLimit = maxValue
      } else {
        // Clases intermedias: Li(n+1) = Ls(n)
        lowerLimit = minValue + i * classWidth
        upperLimit = lowerLimit + classWidth
      }

      const classmark = (lowerLimit + upperLimit) / 2

      const frequency = processedData.filter((value) => {
        if (i === numberOfClasses - 1) {
          return value >= lowerLimit && value <= upperLimit
        } else {
          return value >= lowerLimit && value < upperLimit
        }
      }).length

      const relativeFreq = (frequency / total) * 100
      cumulativeFreq += frequency
      cumulativeRelativeFreq += relativeFreq

      intervals.push({
        class: `${i + 1}`,
        lowerLimit: Math.round(lowerLimit * 100) / 100,
        upperLimit: Math.round(upperLimit * 100) / 100,
        classmark: Math.round(classmark * 100) / 100,
        frequency,
        relativeFreq: Math.round(relativeFreq * 100) / 100,
        cumulativeFreq,
        cumulativeRelativeFreq: Math.round(cumulativeRelativeFreq * 100) / 100,
      })
    }

    return intervals
  }, [processedData, groupedStats, dataType])

  // Calcular estadísticas incluyendo skewness y kurtosis
  const statistics = useMemo((): Statistics => {
    if (!Array.isArray(processedData) || processedData.length === 0)
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

    const sorted = [...processedData].sort((a, b) => a - b)
    const n = processedData.length

    // Media
    const mean = processedData.reduce((sum, val) => sum + val, 0) / n

    // Mediana
    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)]

    // Moda
    const frequencyMap = new Map<number, number>()
    processedData.forEach((value) => {
      frequencyMap.set(value, (frequencyMap.get(value) || 0) + 1)
    })

    const maxFreq = Math.max(...frequencyMap.values())
    const mode = Array.from(frequencyMap.entries())
      .filter(([, freq]) => freq === maxFreq)
      .map(([value]) => value)

    // Varianza y desviación estándar
    const variance =
      processedData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (sampleType === "sample" ? n - 1 : n)
    const standardDeviation = Math.sqrt(variance)

    // Skewness (Coeficiente de Asimetría)
    const m3 = processedData.reduce((sum, val) => sum + Math.pow(val - mean, 3), 0) / n
    const skewness = m3 / Math.pow(standardDeviation, 3)

    // Sesgo estandarizado
    const standardizedSkewness = skewness / Math.sqrt(6 / n)

    // Kurtosis (Curtosis)
    const m4 = processedData.reduce((sum, val) => sum + Math.pow(val - mean, 4), 0) / n
    const kurtosis = m4 / Math.pow(standardDeviation, 4) - 3 // Excess kurtosis

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
  }, [processedData, sampleType])

  // Datos para gráficas con validación
  const chartData = useMemo(() => {
    if (!Array.isArray(frequencyTable)) return []
    return frequencyTable
      .filter(item => item != null)
      .map((item) => ({
        value: item.value?.toString() || "",
        frequency: item.frequency || 0,
        relativeFreq: item.relativeFreq || 0,
        cumulativeFreq: item.cumulativeFreq || 0,
        cumulativeRelativeFreq: item.cumulativeRelativeFreq || 0,
      }))
  }, [frequencyTable])

  const groupedChartData = useMemo(() => {
    if (!Array.isArray(groupedFrequencyTable)) return []
    return groupedFrequencyTable
      .filter(item => item != null)
      .map((item) => ({
        class: item.class || "",
        frequency: item.frequency || 0,
        relativeFreq: item.relativeFreq || 0,
        cumulativeFreq: item.cumulativeFreq || 0,
        cumulativeRelativeFreq: item.cumulativeRelativeFreq || 0,
      }))
  }, [groupedFrequencyTable])

  const groupedPieData = useMemo(() => {
    if (!Array.isArray(groupedFrequencyTable)) return []
    return groupedFrequencyTable
      .filter(item => item != null) // Filter out null items
      .map((item, index) => ({
        name: item.class || `${index + 1}`,
        value: item.frequency || 0,
        fill: `hsl(${(index * 360) / groupedFrequencyTable.length}, 70%, 50%)`,
      }))
  }, [groupedFrequencyTable])

  const pieData = useMemo(() => {
    if (!Array.isArray(frequencyTable)) return []
    return frequencyTable
      .filter(item => item != null) // Filter out null items
      .map((item, index) => ({
        name: item.value?.toString() || `${index}`,
        value: item.frequency || 0,
        fill: `hsl(${(index * 360) / frequencyTable.length}, 70%, 50%)`,
      }))
  }, [frequencyTable])

  const resetData = () => {
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
  }

  return (
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

            {dataType === "xr-charts" ? (
              // X-R Table Input
              <div className="space-y-4">
                {/* Input Method Selection */}
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
                  // Excel Data Input
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
                    <div className="text-xs sm:text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                      <strong>Instrucciones:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Seleccione los datos en Excel (incluyendo filas y columnas)</li>
                        <li>Copie los datos (Ctrl+C)</li>
                        <li>Pegue los datos en el área de texto de arriba (Ctrl+V)</li>
                        <li>Haga clic en "Procesar Datos de Excel"</li>
                        <li>Solo se aceptan valores numéricos</li>
                        <li>Las columnas pueden estar separadas por tabulaciones o comas</li>
                        <li>
                          <strong>Límite máximo: 20 columnas</strong>
                        </li>
                        <li>Los resultados X-R se generarán automáticamente</li>
                      </ul>
                    </div>

                    {/* Excel Preview Table */}
                    {showExcelPreview && Array.isArray(xrTableData) && xrTableData.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm sm:text-base">Vista previa de datos importados:</h4>
                        <div className="overflow-x-auto border rounded-lg max-h-64">
                          <table className="w-full min-w-max">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="p-1 sm:p-2 border-r font-medium text-xs sm:text-sm">Subgrupo</th>
                                {Array.from({ length: xrCols }, (_, i) => (
                                  <th key={i} className="p-1 sm:p-2 border-r font-medium text-xs sm:text-sm">
                                    X{i + 1}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {xrTableData.map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-t">
                                  <td className="p-1 sm:p-2 border-r font-medium bg-gray-50 text-center text-xs sm:text-sm">
                                    {rowIndex + 1}
                                  </td>
                                  {Array.isArray(row) &&
                                    row.map((cell, colIndex) => (
                                      <td key={colIndex} className="p-1 sm:p-2 border-r text-center text-xs sm:text-sm">
                                        {cell || 0}
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
                ) : (
                  // Manual Table Input
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
                        <Button size="sm" variant="outline" onClick={() => addMultipleXRRows(5)} className="text-xs">
                          +5
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => addMultipleXRRows(10)} className="text-xs">
                          +10
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
            ) : (
              // Regular Data Input (No Excel option for ungrouped/grouped)
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

        {/* Data Preview Section */}
        {showPreview && dataType === "xr-charts" && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Vista Previa de Datos</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Revise los datos antes del procesamiento final
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {dataType === "xr-charts" && Array.isArray(previewXRData) && previewXRData.length > 0 ? (
                // X-R Data Preview
                <div className="space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                      <div className="text-lg sm:text-2xl font-bold text-blue-600">{previewXRData.length}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Subgrupos</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                      <div className="text-lg sm:text-2xl font-bold text-green-600">
                        {previewXRData.length > 0 && Array.isArray(previewXRData[0]) ? previewXRData[0].length : 0}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">Observaciones por Subgrupo</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                      <div className="text-lg sm:text-2xl font-bold text-purple-600">
                        {previewXRData.reduce(
                          (sum, subgroup) => sum + (Array.isArray(subgroup) ? subgroup.length : 0),
                          0,
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">Total de Datos</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                      <div className="text-lg sm:text-2xl font-bold text-orange-600">
                        {previewXRData.length > 0
                          ? Math.min(...previewXRData.flat()).toFixed(2) +
                            " - " +
                            Math.max(...previewXRData.flat()).toFixed(2)
                          : "N/A"}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">Rango de Valores</div>
                    </div>
                  </div>

                  <div className="overflow-x-auto border rounded-lg max-h-64">
                    <table className="w-full min-w-max">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-1 sm:p-2 border-r font-medium text-xs sm:text-sm">Subgrupo</th>
                          {Array.from(
                            { length: Math.max(...previewXRData.map((row) => (Array.isArray(row) ? row.length : 0))) },
                            (_, i) => (
                              <th key={i} className="p-1 sm:p-2 border-r font-medium text-xs sm:text-sm">
                                X{i + 1}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {previewXRData.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-t">
                            <td className="p-1 sm:p-2 border-r font-medium bg-gray-50 text-center text-xs sm:text-sm">
                              {rowIndex + 1}
                            </td>
                            {Array.isArray(row) &&
                              row.map((cell, colIndex) => (
                                <td key={colIndex} className="p-1 sm:p-2 border-r text-center text-xs sm:text-sm">
                                  {cell || 0}
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {dataType === "xr-charts" && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg text-xs sm:text-sm">
                  <strong>✓ Datos validados correctamente</strong>
                  <br />
                  Todos los valores son numéricos válidos. Haga clic en "Confirmar y Procesar" para continuar con el
                  análisis estadístico.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {showResults && (
          <>
            {dataType === "xr-charts" && xrData ? (
              // X-R Charts Results
              <>
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">Estadísticas de Control X-R</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {/* Summary Statistics */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                      <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-blue-600">{xrData.xBarBar.toFixed(5)}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Media de Medias (X̄̄)</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-green-600">{xrData.rBar.toFixed(5)}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Media de Rangos (R̄)</div>
                      </div>
                    </div>

                    {/* Control Chart Data Table */}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs sm:text-sm">Subgrupo</TableHead>
                            {/* X Chart Columns */}
                            <TableHead className="text-xs sm:text-sm bg-blue-50">Media (X̄)</TableHead>
                            <TableHead className="text-xs sm:text-sm bg-blue-50">LC X̄</TableHead>
                            <TableHead className="text-xs sm:text-sm bg-blue-50">LCS X̄</TableHead>
                            <TableHead className="text-xs sm:text-sm bg-blue-50">LCI X̄</TableHead>
                            {/* R Chart Columns */}
                            <TableHead className="text-xs sm:text-sm bg-green-50">Rango (R)</TableHead>
                            <TableHead className="text-xs sm:text-sm bg-green-50">LC R</TableHead>
                            <TableHead className="text-xs sm:text-sm bg-green-50">LCS R</TableHead>
                            <TableHead className="text-xs sm:text-sm bg-green-50">LCI R</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.isArray(xrData.subgroups) &&
                            xrData.subgroups.map((_, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium text-xs sm:text-sm">{index + 1}</TableCell>
                                {/* X Chart Data */}
                                <TableCell className="text-xs sm:text-sm bg-blue-50">
                                  {xrData.xBar[index]?.toFixed(5) || "0.00000"}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm bg-blue-50">
                                  {xrData.xBarBar.toFixed(5)}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm bg-blue-50">
                                  {xrData.uclX.toFixed(5)}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm bg-blue-50">
                                  {xrData.lclX.toFixed(5)}
                                </TableCell>
                                {/* R Chart Data */}
                                <TableCell className="text-xs sm:text-sm bg-green-50">
                                  {xrData.rValues[index]?.toFixed(5) || "0.00000"}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm bg-green-50">
                                  {xrData.rBar.toFixed(5)}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm bg-green-50">
                                  {xrData.uclR.toFixed(5)}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm bg-green-50">
                                  {xrData.lclR.toFixed(5)}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Chart Generation Buttons */}
                    <div className="space-y-4 mt-6">
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
                        <Button
                          variant={activeChart === "xyr" ? "default" : "outline"}
                          onClick={() => setActiveChart(activeChart === "xyr" ? null : "xyr")}
                          size="sm"
                          className="text-xs sm:text-sm"
                        >
                          <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Gráfica X̄ y R
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              // Regular Statistics Results
              <>
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">Estadísticas Descriptivas</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {dataType === "grouped" && groupedStats && (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                        <div className="text-center p-3 sm:p-4 bg-indigo-50 rounded-lg">
                          <div className="text-lg sm:text-2xl font-bold text-indigo-600">{groupedStats.totalData}</div>
                          <div className="text-xs sm:text-sm text-gray-600">Total de Datos</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-cyan-50 rounded-lg">
                          <div className="text-lg sm:text-2xl font-bold text-cyan-600">{groupedStats.maxValue}</div>
                          <div className="text-xs sm:text-sm text-gray-600">Valor Máximo</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-teal-50 rounded-lg">
                          <div className="text-lg sm:text-2xl font-bold text-teal-600">{groupedStats.minValue}</div>
                          <div className="text-xs sm:text-sm text-gray-600">Valor Mínimo</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-emerald-50 rounded-lg">
                          <div className="text-lg sm:text-2xl font-bold text-emerald-600">{groupedStats.range}</div>
                          <div className="text-xs sm:text-sm text-gray-600">Rango</div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-red-600">{statistics.standardDeviation}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Desv. Estándar</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-yellow-600">{statistics.skewness}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Asimetría</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-pink-50 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-pink-600">{statistics.kurtosis}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Curtosis</div>
                      </div>
                    </div>

                    {Array.isArray(statistics.mode) && statistics.mode.length > 1 && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <strong className="text-sm sm:text-base">Modas:</strong>{" "}
                        <span className="text-sm sm:text-base">{statistics.mode.join(", ")}</span>
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs sm:text-sm">
                      <strong>Información:</strong> Datos {sampleType === "sample" ? "muestrales" : "poblacionales"}(
                      {processedData.length} valores) - Tipo: {dataType === "grouped" ? "Agrupados" : "No agrupados"}
                      {dataType === "grouped" && groupedStats && (
                        <span>
                          {" "}
                          | Clases: {groupedStats.numberOfClasses} | Amplitud: {groupedStats.classWidth}
                        </span>
                      )}
                      <br />
                      <strong>Sesgo Estandarizado:</strong> {statistics.standardizedSkewness}
                    </div>
                  </CardContent>
                </Card>

                {/* Frequency Table */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">Tabla de Frecuencias</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="overflow-x-auto">
                      {dataType === "ungrouped" ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs sm:text-sm">Valor</TableHead>
                              <TableHead className="text-xs sm:text-sm">Frecuencia</TableHead>
                              <TableHead className="text-xs sm:text-sm">Freq. Relativa (%)</TableHead>
                              <TableHead className="text-xs sm:text-sm">Freq. Acumulada</TableHead>
                              <TableHead className="text-xs sm:text-sm">Freq. Rel. Acum. (%)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Array.isArray(frequencyTable) &&
                              frequencyTable.map((row, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium text-xs sm:text-sm">{row?.value || 0}</TableCell>
                                  <TableCell className="text-xs sm:text-sm">{row?.frequency || 0}</TableCell>
                                  <TableCell className="text-xs sm:text-sm">{row?.relativeFreq || 0}%</TableCell>
                                  <TableCell className="text-xs sm:text-sm">{row?.cumulativeFreq || 0}</TableCell>
                                  <TableCell className="text-xs sm:text-sm">
                                    {row?.cumulativeRelativeFreq || 0}%
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs sm:text-sm">Clase</TableHead>
                              <TableHead className="text-xs sm:text-sm">LI</TableHead>
                              <TableHead className="text-xs sm:text-sm">LS</TableHead>
                              <TableHead className="text-xs sm:text-sm">Marca de Clase (mi)</TableHead>
                              <TableHead className="text-xs sm:text-sm">Frecuencia</TableHead>
                              <TableHead className="text-xs sm:text-sm">Freq. Relativa (%)</TableHead>
                              <TableHead className="text-xs sm:text-sm">Frec. Acumulada</TableHead>
                              <TableHead className="text-xs sm:text-sm">Freq. Rel. Acum. (%)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Array.isArray(groupedFrequencyTable) &&
                              groupedFrequencyTable.map((row, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium text-xs sm:text-sm">{row?.class || ""}</TableCell>
                                  <TableCell className="text-xs sm:text-sm">{row?.lowerLimit || 0}</TableCell>
                                  <TableCell className="text-xs sm:text-sm">{row?.upperLimit || 0}</TableCell>
                                  <TableCell className="text-xs sm:text-sm">{row?.classmark || 0}</TableCell>
                                  <TableCell className="text-xs sm:text-sm">{row?.frequency || 0}</TableCell>
                                  <TableCell className="text-xs sm:text-sm">{row?.relativeFreq || 0}%</TableCell>
                                  <TableCell className="text-xs sm:text-sm">{row?.cumulativeFreq || 0}</TableCell>
                                  <TableCell className="text-xs sm:text-sm">
                                    {row?.cumulativeRelativeFreq || 0}%
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>

                    {/* Chart Buttons */}
                    <div className="space-y-4 mt-6">
                      <div>
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
                            variant={activeChart === "relative" ? "default" : "outline"}
                            onClick={() => setActiveChart(activeChart === "relative" ? null : "relative")}
                            size="sm"
                            className="text-xs sm:text-sm"
                          >
                            <PieChartIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Freq. Relativa
                          </Button>
                          <Button
                            variant={activeChart === "cumulative" ? "default" : "outline"}
                            onClick={() => setActiveChart(activeChart === "cumulative" ? null : "cumulative")}
                            size="sm"
                            className="text-xs sm:text-sm"
                          >
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Freq. Acumulada
                          </Button>
                          <Button
                            variant={activeChart === "cumulative-bar" ? "default" : "outline"}
                            onClick={() => setActiveChart(activeChart === "cumulative-bar" ? null : "cumulative-bar")}
                            size="sm"
                            className="text-xs sm:text-sm"
                          >
                            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Frec. Acum. (Barras)
                          </Button>
                          <Button
                            variant={activeChart === "cumulative-relative-bar" ? "default" : "outline"}
                            onClick={() =>
                              setActiveChart(
                                activeChart === "cumulative-relative-bar" ? null : "cumulative-relative-bar",
                              )
                            }
                            size="sm"
                            className="text-xs sm:text-sm"
                          >
                            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Freq. Rel. Acum. (Barras)
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

                      <div>
                        <h4 className="font-semibold mb-2 text-sm sm:text-base">Gráficas Especializadas:</h4>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={activeChart === "boxplot" ? "default" : "outline"}
                            onClick={() => setActiveChart(activeChart === "boxplot" ? null : "boxplot")}
                            size="sm"
                            className="text-xs sm:text-sm"
                          >
                            <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Diagrama de Caja
                          </Button>
                          <Button
                            variant={activeChart === "skewness" ? "default" : "outline"}
                            onClick={() => setActiveChart(activeChart === "skewness" ? null : "skewness")}
                            size="sm"
                            className="text-xs sm:text-sm"
                          >
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Asimetría
                          </Button>
                          <Button
                            variant={activeChart === "kurtosis" ? "default" : "outline"}
                            onClick={() => setActiveChart(activeChart === "kurtosis" ? null : "kurtosis")}
                            size="sm"
                            className="text-xs sm:text-sm"
                          >
                            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Curtosis
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Charts */}
            {activeChart && (
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">
                    {activeChart === "frequency" && "Gráfica de Frecuencias"}
                    {activeChart === "relative" && "Gráfica de Frecuencias Relativas"}
                    {activeChart === "cumulative" && "Gráfica de Frecuencias Acumuladas"}
                    {activeChart === "cumulative-bar" && "Gráfica de Barras - Frecuencias Acumuladas"}
                    {activeChart === "cumulative-relative-bar" &&
                      "Gráfica de Barras - Frecuencias Relativas Acumuladas"}
                    {activeChart === "pie" && "Gráfica Circular"}
                    {activeChart === "boxplot" && "Diagrama de Caja y Bigotes"}
                    {activeChart === "skewness" && "Gráfica de Asimetría"}
                    {activeChart === "kurtosis" && "Gráfica de Curtosis"}
                    {activeChart === "xbar" && "Gráfica de Control X̄ (Medias)"}
                    {activeChart === "r" && "Gráfica de Control R (Rangos)"}
                    {activeChart === "xyr" && "Gráficas de Control X̄ y R"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className={activeChart === "xyr" ? "space-y-6" : ""}>
                    {activeChart === "xyr" && xrData && Array.isArray(xrData.xBar) && Array.isArray(xrData.rValues) ? (
                      // Combined X and R charts with proper sections
                      <div className="space-y-8">
                        <div>
                          <h4 className="font-semibold mb-4 text-base sm:text-lg">Gráfica X̄ (Medias)</h4>
                          <div className="h-64 sm:h-80">
                            <ResponsiveContainer width="100%" height="100%">
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
                                <YAxis
                                  domain={[
                                    (dataMin) => {
                                      const xBarMin = Math.min(...xrData.xBar, xrData.lclX)
                                      const xBarMax = Math.max(...xrData.xBar, xrData.uclX)
                                      const xBarRange = xBarMax - xBarMin
                                      const xBarMargin = Math.max(xBarRange * 0.1, 1)
                                      return Number((xBarMin - xBarMargin).toFixed(2))
                                    },
                                    (dataMax) => {
                                      const xBarMin = Math.min(...xrData.xBar, xrData.lclX)
                                      const xBarMax = Math.max(...xrData.xBar, xrData.uclX)
                                      const xBarRange = xBarMax - xBarMin
                                      const xBarMargin = Math.max(xBarRange * 0.1, 1)
                                      return Number((xBarMax + xBarMargin).toFixed(2))
                                    },
                                  ]}
                                />
                                <Tooltip formatter={(value, name) => [Number(value).toFixed(2), name]} />
                                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
                                <Line type="monotone" dataKey="LCS" stroke="#dc2626" strokeDasharray="5 5" />
                                <Line type="monotone" dataKey="LCI" stroke="#dc2626" strokeDasharray="5 5" />
                                <Line type="monotone" dataKey="LC" stroke="#16a34a" strokeDasharray="3 3" />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-4 text-base sm:text-lg">Gráfica R (Rangos)</h4>
                          <div className="h-64 sm:h-80">
                            <ResponsiveContainer width="100%" height="100%">
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
                                <YAxis
                                  domain={[
                                    (dataMin) => {
                                      const rMin = Math.min(...xrData.rValues, xrData.lclR)
                                      const rMax = Math.max(...xrData.rValues, xrData.uclR)
                                      const rRange = rMax - rMin
                                      const rMargin = Math.max(rRange * 0.1, 1)
                                      return Number((rMin - rMargin).toFixed(2))
                                    },
                                    (dataMax) => {
                                      const rMin = Math.min(...xrData.rValues, xrData.lclR)
                                      const rMax = Math.max(...xrData.rValues, xrData.uclR)
                                      const rRange = rMax - rMin
                                      const rMargin = Math.max(rRange * 0.1, 1)
                                      return Number((rMax + rMargin).toFixed(2))
                                    },
                                  ]}
                                />
                                <Tooltip formatter={(value, name) => [Number(value).toFixed(2), name]} />
                                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
                                <Line type="monotone" dataKey="LCS" stroke="#dc2626" strokeDasharray="5 5" />
                                <Line type="monotone" dataKey="LCI" stroke="#dc2626" strokeDasharray="5 5" />
                                <Line type="monotone" dataKey="LC" stroke="#16a34a" strokeDasharray="3 3" />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Single chart with proper height
                      <div className="h-64 sm:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          {activeChart === "frequency" && Array.isArray(chartData) && (
                            <BarChart data={dataType === "grouped" ? groupedChartData : chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey={dataType === "grouped" ? "class" : "value"} />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="frequency" fill="#3b82f6" />
                            </BarChart>
                          )}
                          {activeChart === "relative" && Array.isArray(chartData) && (
                            <BarChart data={dataType === "grouped" ? groupedChartData : chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey={dataType === "grouped" ? "class" : "value"} />
                              <YAxis />
                              <Tooltip formatter={(value) => [`${value}%`, "Frecuencia Relativa"]} />
                              <Bar dataKey="relativeFreq" fill="#10b981" />
                            </BarChart>
                          )}
                          {activeChart === "cumulative" && Array.isArray(chartData) && (
                            <LineChart data={dataType === "grouped" ? groupedChartData : chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey={dataType === "grouped" ? "class" : "value"} />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="cumulativeFreq" stroke="#f59e0b" strokeWidth={3} />
                            </LineChart>
                          )}
                          {activeChart === "cumulative-bar" && Array.isArray(chartData) && (
                            <BarChart data={dataType === "grouped" ? groupedChartData : chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey={dataType === "grouped" ? "class" : "value"} />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="cumulativeFreq" fill="#f59e0b" />
                            </BarChart>
                          )}
                          {activeChart === "cumulative-relative-bar" && Array.isArray(chartData) && (
                            <BarChart data={dataType === "grouped" ? groupedChartData : chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey={dataType === "grouped" ? "class" : "value"} />
                              <YAxis />
                              <Tooltip formatter={(value) => [`${value}%`, "Frecuencia Relativa Acumulada"]} />
                              <Bar dataKey="cumulativeRelativeFreq" fill="#8b5cf6" />
                            </BarChart>
                          )}
                          {activeChart === "pie" && Array.isArray(pieData) && (
                            <PieChart>
                              <Pie
                                data={dataType === "grouped" ? groupedPieData : pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {(dataType === "grouped" ? groupedPieData : pieData).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry?.fill || "#8884d8"} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          )}
                          {activeChart === "skewness" && Array.isArray(chartData) && (
                            <AreaChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="value" />
                              <YAxis />
                              <Tooltip />
                              <Area
                                type="monotone"
                                dataKey="frequency"
                                stroke="#8884d8"
                                fill={
                                  statistics.skewness > 0 ? "#ff7300" : statistics.skewness < 0 ? "#00ff73" : "#8884d8"
                                }
                                fillOpacity={0.6}
                              />
                            </AreaChart>
                          )}
                          {activeChart === "kurtosis" && Array.isArray(chartData) && (
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="value" />
                              <YAxis />
                              <Tooltip />
                              <Bar
                                dataKey="frequency"
                                fill={
                                  statistics.kurtosis > 0 ? "#ff4444" : statistics.kurtosis < 0 ? "#44ff44" : "#4444ff"
                                }
                              />
                            </BarChart>
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
                              <YAxis
                                domain={[
                                  (dataMin) => {
                                    const xBarMin = Math.min(...xrData.xBar, xrData.lclX)
                                    const xBarMax = Math.max(...xrData.xBar, xrData.uclX)
                                    const xBarRange = xBarMax - xBarMin
                                    const xBarMargin = Math.max(xBarRange * 0.1, 1)
                                    return Number((xBarMin - xBarMargin).toFixed(2))
                                  },
                                  (dataMax) => {
                                    const xBarMin = Math.min(...xrData.xBar, xrData.lclX)
                                    const xBarMax = Math.max(...xrData.xBar, xrData.uclX)
                                    const xBarRange = xBarMax - xBarMin
                                    const xBarMargin = Math.max(xBarRange * 0.1, 1)
                                    return Number((xBarMax + xBarMargin).toFixed(2))
                                  },
                                ]}
                              />
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
                              <YAxis
                                domain={[
                                  (dataMin) => {
                                    const rMin = Math.min(...xrData.rValues, xrData.lclR)
                                    const rMax = Math.max(...xrData.rValues, xrData.uclR)
                                    const rRange = rMax - rMin
                                    const rMargin = Math.max(rRange * 0.1, 1)
                                    return Number((rMin - rMargin).toFixed(2))
                                  },
                                  (dataMax) => {
                                    const rMin = Math.min(...xrData.rValues, xrData.lclR)
                                    const rMax = Math.max(...xrData.rValues, xrData.uclR)
                                    const rRange = rMax - rMin
                                    const rMargin = Math.max(rRange * 0.1, 1)
                                    return Number((rMax + rMargin).toFixed(2))
                                  },
                                ]}
                              />
                              <Tooltip formatter={(value, name) => [Number(value).toFixed(2), name]} />
                              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
                              <Line type="monotone" dataKey="LCS" stroke="#dc2626" strokeDasharray="5 5" />
                              <Line type="monotone" dataKey="LCI" stroke="#dc2626" strokeDasharray="5 5" />
                              <Line type="monotone" dataKey="LC" stroke="#16a34a" strokeDasharray="3 3" />
                            </LineChart>
                          )}
                          {activeChart === "boxplot" &&
                            (() => {
                              const boxData = calculateBoxPlotData()
                              const svgWidth = 400
                              const svgHeight = 200
                              const margin = { top: 20, right: 40, bottom: 60, left: 40 }
                              const plotWidth = svgWidth - margin.left - margin.right
                              const plotHeight = svgHeight - margin.top - margin.bottom

                              const dataRange = boxData.max - boxData.min
                              const scale = plotWidth / (dataRange * 1.2)
                              const offset = margin.left + plotWidth * 0.1

                              const getX = (value: number) => offset + (value - boxData.min) * scale
                              const boxY = margin.top + 20
                              const boxHeight = 60
                              const whiskerY = boxY + boxHeight / 2

                              return (
                                <div className="flex flex-col items-center justify-center h-full">
                                  <div className="relative bg-white rounded border">
                                    <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                                      <rect
                                        x={getX(boxData.q1)}
                                        y={boxY}
                                        width={getX(boxData.q3) - getX(boxData.q1)}
                                        height={boxHeight}
                                        fill="#a7f3d0"
                                        stroke="#000000"
                                        strokeWidth="2"
                                      />
                                      <line
                                        x1={getX(boxData.median)}
                                        y1={boxY}
                                        x2={getX(boxData.median)}
                                        y2={boxY + boxHeight}
                                        stroke="#dc2626"
                                        strokeWidth="2"
                                      />
                                      <line
                                        x1={getX(boxData.min)}
                                        y1={whiskerY}
                                        x2={getX(boxData.q1)}
                                        y2={whiskerY}
                                        stroke="#dc2626"
                                        strokeWidth="2"
                                      />
                                      <line
                                        x1={getX(boxData.q3)}
                                        y1={whiskerY}
                                        x2={getX(boxData.max)}
                                        y2={whiskerY}
                                        stroke="#dc2626"
                                        strokeWidth="2"
                                      />
                                      <line
                                        x1={getX(boxData.min)}
                                        y1={boxY + 10}
                                        x2={getX(boxData.min)}
                                        y2={boxY + boxHeight - 10}
                                        stroke="#dc2626"
                                        strokeWidth="2"
                                      />
                                      <line
                                        x1={getX(boxData.max)}
                                        y1={boxY + 10}
                                        x2={getX(boxData.max)}
                                        y2={boxY + boxHeight - 10}
                                        stroke="#dc2626"
                                        strokeWidth="2"
                                      />
                                      <line
                                        x1={margin.left}
                                        y1={svgHeight - margin.bottom + 10}
                                        x2={svgWidth - margin.right}
                                        y2={svgHeight - margin.bottom + 10}
                                        stroke="#6b7280"
                                        strokeWidth="1"
                                      />
                                      {[
                                        { value: boxData.min, label: "Min" },
                                        { value: boxData.q1, label: "Q₁" },
                                        { value: boxData.median, label: "Me" },
                                        { value: boxData.q3, label: "Q₃" },
                                        { value: boxData.max, label: "Max" },
                                      ].map(({ value, label }, index) => (
                                        <g key={index}>
                                          <line
                                            x1={getX(value)}
                                            y1={svgHeight - margin.bottom + 5}
                                            x2={getX(value)}
                                            y2={svgHeight - margin.bottom + 15}
                                            stroke="#6b7280"
                                            strokeWidth="1"
                                          />
                                          <text
                                            x={getX(value)}
                                            y={svgHeight - margin.bottom + 30}
                                            textAnchor="middle"
                                            fontSize="12"
                                            fill="#374151"
                                            fontStyle="italic"
                                          >
                                            {label}
                                          </text>
                                          <text
                                            x={getX(value)}
                                            y={svgHeight - margin.bottom + 45}
                                            textAnchor="middle"
                                            fontSize="10"
                                            fill="#6b7280"
                                          >
                                            {value.toFixed(2)}
                                          </text>
                                        </g>
                                      ))}
                                      {Array.isArray(boxData.outliers) &&
                                        boxData.outliers.map((outlier, index) => (
                                          <circle
                                            key={index}
                                            cx={getX(outlier)}
                                            cy={whiskerY}
                                            r="4"
                                            fill="#dc2626"
                                            stroke="#dc2626"
                                            strokeWidth="1"
                                          />
                                        ))}
                                    </svg>
                                  </div>
                                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                      <div className="text-center">
                                        <div className="font-semibold">Rango Intercuartílico</div>
                                        <div className="text-blue-600">{boxData.iqr.toFixed(3)}</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="font-semibold">Valores Atípicos</div>
                                        <div className="text-red-600">
                                          {Array.isArray(boxData.outliers) ? boxData.outliers.length : 0}
                                        </div>
                                      </div>
                                      <div className="text-center">
                                        <div className="font-semibold">Rango Total</div>
                                        <div className="text-green-600">{(boxData.max - boxData.min).toFixed(3)}</div>
                                      </div>
                                    </div>
                                    {Array.isArray(boxData.outliers) && boxData.outliers.length > 0 && (
                                      <div className="mt-2 text-xs text-gray-600">
                                        <strong>Outliers:</strong>{" "}
                                        {boxData.outliers.map((o) => o.toFixed(2)).join(", ")}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })()}
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Additional information for specific charts */}
                  {activeChart === "skewness" && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                        <div>
                          <strong>Coeficiente de Asimetría:</strong> {statistics.skewness}
                          <br />
                          <strong>Interpretación:</strong>{" "}
                          {statistics.skewness > 0.5
                            ? "Asimetría positiva (cola derecha)"
                            : statistics.skewness < -0.5
                              ? "Asimetría negativa (cola izquierda)"
                              : "Aproximadamente simétrica"}
                        </div>
                        <div>
                          <strong>Sesgo Estandarizado:</strong> {statistics.standardizedSkewness}
                          <br />
                          <strong>Significancia:</strong>{" "}
                          {Math.abs(statistics.standardizedSkewness) > 1.96
                            ? "Significativamente asimétrica (p < 0.05)"
                            : "No significativamente asimétrica"}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeChart === "kurtosis" && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-xs sm:text-sm">
                        <strong>Coeficiente de Curtosis:</strong> {statistics.kurtosis}
                        <br />
                        <strong>Interpretación:</strong>{" "}
                        {statistics.kurtosis > 0
                          ? "Leptocúrtica (más puntiaguda que la normal)"
                          : statistics.kurtosis < 0
                            ? "Platicúrtica (más plana que la normal)"
                            : "Mesocúrtica (similar a la distribución normal)"}
                        <br />
                        <strong>Nota:</strong> Valores cercanos a 0 indican una distribución similar a la normal en
                        términos de curtosis.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
