"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Calculator, BarChart3, TrendingUp, PieChartIcon, Activity, Package } from "lucide-react"

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
  const [dataType, setDataType] = useState<"grouped" | "ungrouped">("ungrouped")
  const [sampleType, setSampleType] = useState<"sample" | "population">("sample")
  const [inputData, setInputData] = useState("")
  const [processedData, setProcessedData] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [activeChart, setActiveChart] = useState<string | null>(null)
  const [groupedStats, setGroupedStats] = useState<GroupedStatistics | null>(null)
  const [xrData, setXrData] = useState<XRData | null>(null)
  const [subgroupSize, setSubgroupSize] = useState(5)

  // Función para procesar los datos de entrada
  const processInput = () => {
    try {
      const numbers = inputData
        .split(/[,\s\n]+/)
        .map((str) => str.trim())
        .filter((str) => str !== "")
        .map((str) => Number.parseFloat(str))
        .filter((num) => !isNaN(num))

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
        const numberOfClasses = Math.floor(1 + 3.322 * Math.log10(totalData))
        const classWidth = range / numberOfClasses

        setGroupedStats({
          totalData,
          maxValue,
          minValue,
          range: Math.round(range * 1000) / 1000,
          classWidth: Math.round(classWidth * 100) / 100,
          numberOfClasses,
        })
      } else {
        setGroupedStats(null)
      }

      setShowResults(true)
      setActiveChart(null)
      setXrData(null)
    } catch (error) {
      alert("Error al procesar los datos. Verifique el formato.")
    }
  }

  const calculateXRData = () => {
    if (processedData.length === 0) return

    // Dividir datos en subgrupos
    const subgroups: number[][] = []
    for (let i = 0; i < processedData.length; i += subgroupSize) {
      const subgroup = processedData.slice(i, i + subgroupSize)
      if (subgroup.length === subgroupSize) {
        subgroups.push(subgroup)
      }
    }

    if (subgroups.length === 0) {
      alert(`No hay suficientes datos para formar subgrupos de tamaño ${subgroupSize}`)
      return
    }

    // Calcular medias y rangos
    const xBar = subgroups.map((subgroup) => subgroup.reduce((sum, val) => sum + val, 0) / subgroup.length)
    const rValues = subgroups.map((subgroup) => Math.max(...subgroup) - Math.min(...subgroup))

    // Calcular límites de control
    const xBarBar = xBar.reduce((sum, val) => sum + val, 0) / xBar.length
    const rBar = rValues.reduce((sum, val) => sum + val, 0) / rValues.length

    // Factores para límites de control (para n=5)
    const A2 = 0.577,
      D3 = 0,
      D4 = 2.114

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
    }

    setXrData(newXrData)
  }

  const calculateBoxPlotData = (): BoxPlotData => {
    if (processedData.length === 0)
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

  // Calcular tabla de frecuencias
  const frequencyTable = useMemo((): FrequencyData[] => {
    if (processedData.length === 0) return []

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
    if (processedData.length === 0 || !groupedStats || dataType !== "grouped") return []

    const { minValue, classWidth, numberOfClasses, maxValue } = groupedStats
    const total = processedData.length
    const intervals: GroupedFrequencyData[] = []

    let cumulativeFreq = 0
    let cumulativeRelativeFreq = 0

    for (let i = 0; i < numberOfClasses; i++) {
      const lowerLimit = minValue + i * classWidth
      // Para la última clase, el límite superior debe ser igual al valor máximo
      const upperLimit = i === numberOfClasses - 1 ? maxValue : minValue + (i + 1) * classWidth
      const classmark = (lowerLimit + upperLimit) / 2

      // Contar frecuencia en este intervalo
      const frequency = processedData.filter((value) => {
        if (i === numberOfClasses - 1) {
          // Último intervalo incluye el límite superior
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

  // Calcular estadísticas
  const statistics = useMemo((): Statistics => {
    if (processedData.length === 0)
      return {
        mean: 0,
        median: 0,
        mode: [],
        variance: 0,
        standardDeviation: 0,
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

    return {
      mean: Math.round(mean * 10000) / 10000,
      median: Math.round(median * 10000) / 10000,
      mode,
      variance: Math.round(variance * 10000) / 10000,
      standardDeviation: Math.round(standardDeviation * 10000) / 10000,
    }
  }, [processedData, sampleType])

  // Datos para gráficas
  const chartData = frequencyTable.map((item) => ({
    value: item.value.toString(),
    frequency: item.frequency,
    relativeFreq: item.relativeFreq,
    cumulativeFreq: item.cumulativeFreq,
    cumulativeRelativeFreq: item.cumulativeRelativeFreq,
  }))

  const groupedChartData = groupedFrequencyTable.map((item) => ({
    class: item.class,
    frequency: item.frequency,
    relativeFreq: item.relativeFreq,
    cumulativeFreq: item.cumulativeFreq,
    cumulativeRelativeFreq: item.cumulativeRelativeFreq,
  }))

  const groupedPieData = groupedFrequencyTable.map((item, index) => ({
    name: item.class,
    value: item.frequency,
    fill: `hsl(${(index * 360) / groupedFrequencyTable.length}, 70%, 50%)`,
  }))

  const pieData = frequencyTable.map((item, index) => ({
    name: item.value.toString(),
    value: item.frequency,
    fill: `hsl(${(index * 360) / frequencyTable.length}, 70%, 50%)`,
  }))

  const resetData = () => {
    setInputData("")
    setProcessedData([])
    setShowResults(false)
    setActiveChart(null)
    setXrData(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <Calculator className="h-8 w-8" />
              Control Estadístico
            </CardTitle>
            <CardDescription>Análisis estadístico completo con tablas de frecuencia y gráficas</CardDescription>
          </CardHeader>
        </Card>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Entrada de Datos</CardTitle>
            <CardDescription>Ingrese los datos separados por comas, espacios o saltos de línea</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Data Type Selection */}
            <div>
              <Label>Tipo de análisis:</Label>
              <div className="flex justify-center gap-4 mt-2">
                <Button
                  variant={dataType === "ungrouped" ? "default" : "outline"}
                  onClick={() => setDataType("ungrouped")}
                  className="px-8"
                >
                  Datos No Agrupados
                </Button>
                <Button
                  variant={dataType === "grouped" ? "default" : "outline"}
                  onClick={() => setDataType("grouped")}
                  className="px-8"
                >
                  Datos Agrupados
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="data-input">Datos:</Label>
              <Textarea
                id="data-input"
                placeholder="Ejemplo: 1, 2, 3, 4, 5 o ingrese cada valor en una línea nueva"
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label>Tipo de datos:</Label>
              <RadioGroup
                value={sampleType}
                onValueChange={(value: "sample" | "population") => setSampleType(value)}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sample" id="sample" />
                  <Label htmlFor="sample">Muestrales</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="population" id="population" />
                  <Label htmlFor="population">Poblacionales</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-4">
              <Button onClick={processInput} className="flex-1">
                Procesar Datos
              </Button>
              <Button variant="outline" onClick={resetData}>
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {showResults && (
          <>
            {/* Statistics Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas Descriptivas</CardTitle>
              </CardHeader>
              <CardContent>
                {dataType === "grouped" && groupedStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-indigo-50 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600">{groupedStats.totalData}</div>
                      <div className="text-sm text-gray-600">Total de Datos</div>
                    </div>
                    <div className="text-center p-4 bg-cyan-50 rounded-lg">
                      <div className="text-2xl font-bold text-cyan-600">{groupedStats.maxValue}</div>
                      <div className="text-sm text-gray-600">Valor Máximo</div>
                    </div>
                    <div className="text-center p-4 bg-teal-50 rounded-lg">
                      <div className="text-2xl font-bold text-teal-600">{groupedStats.minValue}</div>
                      <div className="text-sm text-gray-600">Valor Mínimo</div>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-600">{groupedStats.range}</div>
                      <div className="text-sm text-gray-600">Rango</div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{statistics.mean}</div>
                    <div className="text-sm text-gray-600">Media</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{statistics.median}</div>
                    <div className="text-sm text-gray-600">Mediana</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {statistics.mode.length === 1 ? statistics.mode[0] : "Múltiple"}
                    </div>
                    <div className="text-sm text-gray-600">Moda</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{statistics.variance}</div>
                    <div className="text-sm text-gray-600">Varianza</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{statistics.standardDeviation}</div>
                    <div className="text-sm text-gray-600">Desv. Estándar</div>
                  </div>
                </div>

                {statistics.mode.length > 1 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <strong>Modas:</strong> {statistics.mode.join(", ")}
                  </div>
                )}

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <strong>Información:</strong> Datos {sampleType === "sample" ? "muestrales" : "poblacionales"}(
                  {processedData.length} valores) - Tipo: {dataType === "grouped" ? "Agrupados" : "No agrupados"}
                  {dataType === "grouped" && groupedStats && (
                    <span>
                      {" "}
                      | Clases: {groupedStats.numberOfClasses} | Amplitud: {groupedStats.classWidth}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Frequency Table */}
            <Card>
              <CardHeader>
                <CardTitle>Tabla de Frecuencias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {dataType === "ungrouped" ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Valor</TableHead>
                          <TableHead>Frecuencia</TableHead>
                          <TableHead>Freq. Relativa (%)</TableHead>
                          <TableHead>Freq. Acumulada</TableHead>
                          <TableHead>Freq. Rel. Acum. (%)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {frequencyTable.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{row.value}</TableCell>
                            <TableCell>{row.frequency}</TableCell>
                            <TableCell>{row.relativeFreq}%</TableCell>
                            <TableCell>{row.cumulativeFreq}</TableCell>
                            <TableCell>{row.cumulativeRelativeFreq}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Clase</TableHead>
                          <TableHead>LI</TableHead>
                          <TableHead>LS</TableHead>
                          <TableHead>Marca de Clase (mi)</TableHead>
                          <TableHead>Frecuencia</TableHead>
                          <TableHead>Freq. Relativa (%)</TableHead>
                          <TableHead>Freq. Acumulada</TableHead>
                          <TableHead>Freq. Rel. Acum. (%)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedFrequencyTable.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{row.class}</TableCell>
                            <TableCell>{row.lowerLimit}</TableCell>
                            <TableCell>{row.upperLimit}</TableCell>
                            <TableCell>{row.classmark}</TableCell>
                            <TableCell>{row.frequency}</TableCell>
                            <TableCell>{row.relativeFreq}%</TableCell>
                            <TableCell>{row.cumulativeFreq}</TableCell>
                            <TableCell>{row.cumulativeRelativeFreq}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                {/* Chart Buttons */}
                <div className="space-y-4 mt-6">
                  {/* Basic Charts */}
                  <div>
                    <h4 className="font-semibold mb-2">Gráficas Básicas:</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={activeChart === "frequency" ? "default" : "outline"}
                        onClick={() => setActiveChart(activeChart === "frequency" ? null : "frequency")}
                        size="sm"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Frecuencia
                      </Button>
                      <Button
                        variant={activeChart === "relative" ? "default" : "outline"}
                        onClick={() => setActiveChart(activeChart === "relative" ? null : "relative")}
                        size="sm"
                      >
                        <PieChartIcon className="h-4 w-4 mr-2" />
                        Freq. Relativa
                      </Button>
                      <Button
                        variant={activeChart === "cumulative" ? "default" : "outline"}
                        onClick={() => setActiveChart(activeChart === "cumulative" ? null : "cumulative")}
                        size="sm"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Freq. Acumulada
                      </Button>
                      <Button
                        variant={activeChart === "pie" ? "default" : "outline"}
                        onClick={() => setActiveChart(activeChart === "pie" ? null : "pie")}
                        size="sm"
                      >
                        <PieChartIcon className="h-4 w-4 mr-2" />
                        Gráfica Circular
                      </Button>
                    </div>
                  </div>

                  {/* Advanced Charts */}
                  <div>
                    <h4 className="font-semibold mb-2">Gráficas Avanzadas:</h4>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="subgroup-size" className="text-sm">
                          Tamaño subgrupo:
                        </Label>
                        <input
                          id="subgroup-size"
                          type="number"
                          min="2"
                          max="10"
                          value={subgroupSize}
                          onChange={(e) => setSubgroupSize(Number(e.target.value))}
                          className="w-16 px-2 py-1 border rounded text-sm"
                        />
                        <Button onClick={calculateXRData} size="sm" variant="outline">
                          Calcular X-R
                        </Button>
                      </div>
                      <Button
                        variant={activeChart === "xbar" ? "default" : "outline"}
                        onClick={() => setActiveChart(activeChart === "xbar" ? null : "xbar")}
                        size="sm"
                        disabled={!xrData}
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Gráfica X̄
                      </Button>
                      <Button
                        variant={activeChart === "r" ? "default" : "outline"}
                        onClick={() => setActiveChart(activeChart === "r" ? null : "r")}
                        size="sm"
                        disabled={!xrData}
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Gráfica R
                      </Button>
                      <Button
                        variant={activeChart === "xyr" ? "default" : "outline"}
                        onClick={() => setActiveChart(activeChart === "xyr" ? null : "xyr")}
                        size="sm"
                        disabled={!xrData}
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Gráfica X y R
                      </Button>
                      <Button
                        variant={activeChart === "boxplot" ? "default" : "outline"}
                        onClick={() => setActiveChart(activeChart === "boxplot" ? null : "boxplot")}
                        size="sm"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Diagrama de Caja
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            {activeChart && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {activeChart === "frequency" && "Gráfica de Frecuencias"}
                    {activeChart === "relative" && "Gráfica de Frecuencias Relativas"}
                    {activeChart === "cumulative" && "Gráfica de Frecuencias Acumuladas"}
                    {activeChart === "pie" && "Gráfica Circular"}
                    {activeChart === "xbar" && "Gráfica de Control X̄ (Medias)"}
                    {activeChart === "r" && "Gráfica de Control R (Rangos)"}
                    {activeChart === "xyr" && "Gráficas de Control X̄ y R"}
                    {activeChart === "boxplot" && "Diagrama de Caja y Bigotes"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={activeChart === "xyr" ? "space-y-6" : "h-80"}>
                    <ResponsiveContainer width="100%" height={activeChart === "xyr" ? 300 : "100%"}>
                      {activeChart === "frequency" && (
                        <BarChart data={dataType === "grouped" ? groupedChartData : chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey={dataType === "grouped" ? "class" : "value"} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="frequency" fill="#3b82f6" />
                        </BarChart>
                      )}
                      {activeChart === "relative" && (
                        <BarChart data={dataType === "grouped" ? groupedChartData : chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey={dataType === "grouped" ? "class" : "value"} />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value}%`, "Frecuencia Relativa"]} />
                          <Bar dataKey="relativeFreq" fill="#10b981" />
                        </BarChart>
                      )}
                      {activeChart === "cumulative" && (
                        <LineChart data={dataType === "grouped" ? groupedChartData : chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey={dataType === "grouped" ? "class" : "value"} />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="cumulativeFreq" stroke="#f59e0b" strokeWidth={3} />
                        </LineChart>
                      )}
                      {activeChart === "pie" && (
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
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      )}
                      {activeChart === "xbar" && xrData && (
                        <LineChart
                          data={xrData.xBar.map((val, index) => ({
                            subgroup: index + 1,
                            value: val,
                            ucl: xrData.uclX,
                            lcl: xrData.lclX,
                            center: xrData.xBarBar,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="subgroup" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
                          <Line type="monotone" dataKey="ucl" stroke="#dc2626" strokeDasharray="5 5" />
                          <Line type="monotone" dataKey="lcl" stroke="#dc2626" strokeDasharray="5 5" />
                          <Line type="monotone" dataKey="center" stroke="#16a34a" strokeDasharray="3 3" />
                        </LineChart>
                      )}
                      {activeChart === "r" && xrData && (
                        <LineChart
                          data={xrData.rValues.map((val, index) => ({
                            subgroup: index + 1,
                            value: val,
                            ucl: xrData.uclR,
                            lcl: xrData.lclR,
                            center: xrData.rBar,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="subgroup" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
                          <Line type="monotone" dataKey="ucl" stroke="#dc2626" strokeDasharray="5 5" />
                          <Line type="monotone" dataKey="lcl" stroke="#dc2626" strokeDasharray="5 5" />
                          <Line type="monotone" dataKey="center" stroke="#16a34a" strokeDasharray="3 3" />
                        </LineChart>
                      )}
                      {activeChart === "xyr" && xrData && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold mb-2">Gráfica X̄ (Medias)</h4>
                            <ResponsiveContainer width="100%" height={300}>
                              <LineChart
                                data={xrData.xBar.map((val, index) => ({
                                  subgroup: index + 1,
                                  value: val,
                                  ucl: xrData.uclX,
                                  lcl: xrData.lclX,
                                  center: xrData.xBarBar,
                                }))}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="subgroup" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
                                <Line type="monotone" dataKey="ucl" stroke="#dc2626" strokeDasharray="5 5" />
                                <Line type="monotone" dataKey="lcl" stroke="#dc2626" strokeDasharray="5 5" />
                                <Line type="monotone" dataKey="center" stroke="#16a34a" strokeDasharray="3 3" />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Gráfica R (Rangos)</h4>
                            <ResponsiveContainer width="100%" height={300}>
                              <LineChart
                                data={xrData.rValues.map((val, index) => ({
                                  subgroup: index + 1,
                                  value: val,
                                  ucl: xrData.uclR,
                                  lcl: xrData.lclR,
                                  center: xrData.rBar,
                                }))}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="subgroup" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
                                <Line type="monotone" dataKey="ucl" stroke="#dc2626" strokeDasharray="5 5" />
                                <Line type="monotone" dataKey="lcl" stroke="#dc2626" strokeDasharray="5 5" />
                                <Line type="monotone" dataKey="center" stroke="#16a34a" strokeDasharray="3 3" />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                      {activeChart === "boxplot" &&
                        (() => {
                          const boxData = calculateBoxPlotData()
                          const svgWidth = 400
                          const svgHeight = 200
                          const margin = { top: 20, right: 40, bottom: 60, left: 40 }
                          const plotWidth = svgWidth - margin.left - margin.right
                          const plotHeight = svgHeight - margin.top - margin.bottom

                          // Scale for positioning
                          const dataRange = boxData.max - boxData.min
                          const scale = plotWidth / (dataRange * 1.2) // Add some padding
                          const offset = margin.left + plotWidth * 0.1 // 10% padding on left

                          const getX = (value: number) => offset + (value - boxData.min) * scale
                          const boxY = margin.top + 20
                          const boxHeight = 60
                          const whiskerY = boxY + boxHeight / 2

                          return (
                            <div className="flex flex-col items-center justify-center h-full">
                              <div className="relative bg-white rounded border">
                                <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                                  {/* Box */}
                                  <rect
                                    x={getX(boxData.q1)}
                                    y={boxY}
                                    width={getX(boxData.q3) - getX(boxData.q1)}
                                    height={boxHeight}
                                    fill="#a7f3d0"
                                    stroke="#000000"
                                    strokeWidth="2"
                                  />

                                  {/* Median line (red) */}
                                  <line
                                    x1={getX(boxData.median)}
                                    y1={boxY}
                                    x2={getX(boxData.median)}
                                    y2={boxY + boxHeight}
                                    stroke="#dc2626"
                                    strokeWidth="2"
                                  />

                                  {/* Left whisker */}
                                  <line
                                    x1={getX(boxData.min)}
                                    y1={whiskerY}
                                    x2={getX(boxData.q1)}
                                    y2={whiskerY}
                                    stroke="#dc2626"
                                    strokeWidth="2"
                                  />

                                  {/* Right whisker */}
                                  <line
                                    x1={getX(boxData.q3)}
                                    y1={whiskerY}
                                    x2={getX(boxData.max)}
                                    y2={whiskerY}
                                    stroke="#dc2626"
                                    strokeWidth="2"
                                  />

                                  {/* Left whisker end cap */}
                                  <line
                                    x1={getX(boxData.min)}
                                    y1={boxY + 10}
                                    x2={getX(boxData.min)}
                                    y2={boxY + boxHeight - 10}
                                    stroke="#dc2626"
                                    strokeWidth="2"
                                  />

                                  {/* Right whisker end cap */}
                                  <line
                                    x1={getX(boxData.max)}
                                    y1={boxY + 10}
                                    x2={getX(boxData.max)}
                                    y2={boxY + boxHeight - 10}
                                    stroke="#dc2626"
                                    strokeWidth="2"
                                  />

                                  {/* Horizontal axis line */}
                                  <line
                                    x1={margin.left}
                                    y1={svgHeight - margin.bottom + 10}
                                    x2={svgWidth - margin.right}
                                    y2={svgHeight - margin.bottom + 10}
                                    stroke="#6b7280"
                                    strokeWidth="1"
                                  />

                                  {/* Axis tick marks and labels */}
                                  {[
                                    { value: boxData.min, label: "Min" },
                                    { value: boxData.q1, label: "Q₁" },
                                    { value: boxData.median, label: "Me" },
                                    { value: boxData.q3, label: "Q₃" },
                                    { value: boxData.max, label: "Max" },
                                  ].map(({ value, label }, index) => (
                                    <g key={index}>
                                      {/* Tick mark */}
                                      <line
                                        x1={getX(value)}
                                        y1={svgHeight - margin.bottom + 5}
                                        x2={getX(value)}
                                        y2={svgHeight - margin.bottom + 15}
                                        stroke="#6b7280"
                                        strokeWidth="1"
                                      />
                                      {/* Label */}
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
                                      {/* Value */}
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

                                  {/* Outliers (red dots) */}
                                  {boxData.outliers.map((outlier, index) => (
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

                              {/* Statistics summary below the chart */}
                              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div className="text-center">
                                    <div className="font-semibold">Rango Intercuartílico</div>
                                    <div className="text-blue-600">{boxData.iqr.toFixed(3)}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-semibold">Valores Atípicos</div>
                                    <div className="text-red-600">{boxData.outliers.length}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-semibold">Rango Total</div>
                                    <div className="text-green-600">{(boxData.max - boxData.min).toFixed(3)}</div>
                                  </div>
                                </div>
                                {boxData.outliers.length > 0 && (
                                  <div className="mt-2 text-xs text-gray-600">
                                    <strong>Outliers:</strong> {boxData.outliers.map((o) => o.toFixed(2)).join(", ")}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })()}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
