// src/app/api/create-pdf/route.ts

import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { storiesByAge } from '@/data/stories'

export async function POST(request: Request) {
  // 1. Parse request body
  const { childName, childAge, photos } = (await request.json()) as {
    childName: string
    childAge: number
    photos: string[]    // array of Data URLs
  }

  // 2. Determine age bracket key
  const ageKey =
    childAge <= 2
      ? '0-2'
      : childAge <= 4
      ? '2-4'
      : childAge <= 6
      ? '4-6'
      : childAge <= 8
      ? '6-8'
      : '8-12'

  // 3. Pick a backup story
  const bucket = storiesByAge[ageKey]
  const pool = bucket.universal || []
  if (pool.length === 0) {
    return NextResponse.json({ error: 'No backup story available' }, { status: 500 })
  }
  const story = pool[0]

  // 4. Prepare the first photo
  const firstPhotoDataUrl = photos[0]
  const [meta, base64] = firstPhotoDataUrl.split(',')
  const isPng = meta.includes('image/png')
  const imgBytes = Buffer.from(base64, 'base64')

  // 5. Create PDF document
  const pdfDoc = await PDFDocument.create()
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // 6. For each page of the story, add a PDF page
  for (let i = 0; i < story.pages; i++) {
    const page = pdfDoc.addPage([400, 600])
    const { width, height } = page.getSize()

    // Embed child photo
    const img = isPng
      ? await pdfDoc.embedPng(imgBytes)
      : await pdfDoc.embedJpg(imgBytes)
    const imgDims = img.scale(0.02)
    page.drawImage(img, {
      x: (width - imgDims.width) / 2,
      y: height - imgDims.height - 20,
      width: imgDims.width,
      height: imgDims.height,
    })

    // On first page, draw title
    if (i === 0) {
      page.drawText(story.title.replace(/{name}/g, childName), {
        x: 30,
        y: height - imgDims.height - 60,
        size: 18,
        font: fontBold,
        color: rgb(0, 0, 0),
      })
    }

    // Draw story text (wrapped)
    const text = story.content.replace(/{name}/g, childName)
    const maxLineLength = 50
    const words = text.split(' ')
    let line = ''
    let y = height - imgDims.height - 80

    words.forEach((word) => {
      const testLine = line + (line === '' ? '' : ' ') + word
      if (testLine.length > maxLineLength) {
        page.drawText(line, {
          x: 30,
          y,
          size: 12,
          font: fontNormal,
          lineHeight: 14,
        })
        line = word
        y -= 14
      } else {
        line = testLine
      }
    })
    // last line
    if (line) {
      page.drawText(line, {
        x: 30,
        y,
        size: 12,
        font: fontNormal,
        lineHeight: 14,
      })
    }
  }

  // 7. Serialize PDF and return
  const pdfBytes = await pdfDoc.save()
  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${childName}-storybook.pdf"`,
    },
  })
}
