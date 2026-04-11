import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../ui/Card'

function ScoreRing({ score }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const size = 160
    canvas.width = size
    canvas.height = size

    const radius = 60
    const thickness = 12
    const centerX = size / 2
    const centerY = size / 2
    const scoreVal = Math.min(100, Math.max(0, score || 0))

    ctx.clearRect(0, 0, size, size)

    // Background ring
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = thickness
    ctx.stroke()

    // Score ring (animated)
    let startAngle = -Math.PI / 2
    const endAngle = startAngle + (scoreVal / 100) * Math.PI * 2
    let current = startAngle

    const animate = () => {
      if (current < endAngle) {
        ctx.clearRect(0, 0, size, size)

        // Background
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.strokeStyle = '#e5e7eb'
        ctx.lineWidth = thickness
        ctx.stroke()

        // Progress
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, startAngle, current)
        ctx.strokeStyle = scoreVal >= 70 ? '#0ea5e9' : scoreVal >= 40 ? '#f59e0b' : '#ef4444'
        ctx.lineWidth = thickness
        ctx.lineCap = 'round'
        ctx.stroke()

        current += 0.05
        requestAnimationFrame(animate)
      } else {
        // Draw final frame
        ctx.clearRect(0, 0, size, size)
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.strokeStyle = '#e5e7eb'
        ctx.lineWidth = thickness
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, startAngle, endAngle)
        ctx.strokeStyle = scoreVal >= 70 ? '#0ea5e9' : scoreVal >= 40 ? '#f59e0b' : '#ef4444'
        ctx.lineWidth = thickness
        ctx.lineCap = 'round'
        ctx.stroke()
      }
    }

    requestAnimationFrame(animate)
  }, [score])

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} />
      <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{score}</span>
    </div>
  )
}

export default function ScoreCard({ result }) {
  const { t } = useTranslation()
  const score = result?.score ?? result?.totalScore ?? 0
  const interpretation = result?.interpretation ?? ''

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100 text-center">
        {t('evaluate.score')}
      </h2>
      <div className="flex flex-col items-center gap-6">
        <ScoreRing score={score} />
        {interpretation && (
          <div className="text-center text-gray-600 dark:text-gray-400 max-w-md">
            {interpretation}
          </div>
        )}
        {result?.breakdown && (
          <div className="w-full space-y-2">
            {Object.entries(result.breakdown).map(([key, val]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{key}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
