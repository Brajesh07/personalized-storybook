// src/app/api/create-pdf/route.ts

import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { storiesByAge } from '@/data/stories'

export async function POST(request: Request) {
  try {
    // 1. Parse request body
    const { childName, childAge, photos, gender } = (await request.json()) as {
      childName: string
      childAge: number
      photos: string[] // array of Data URLs
      gender?: string // Optional gender field
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
        : childAge <= 10
        ? '8-10'
        : '10-12'

    // 3. Pick a backup story
    const bucket = storiesByAge[ageKey]
    let pool = []

    // Try gender-specific stories first if gender is provided
    if (gender && (gender.toLowerCase() === 'boy' || gender.toLowerCase() === 'girl')) {
      const genderKey = gender.toLowerCase() as 'boy' | 'girl';
      if (bucket && Object.prototype.hasOwnProperty.call(bucket, genderKey)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pool = (bucket as Record<string, any>)[genderKey] || [];
      }
    }

    // Fall back to universal stories
    if (pool.length === 0) {
      pool = bucket.universal || []
    }

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
      const { width: pageWidth, height: pageHeight } = page.getSize()

      // Embed child photo with aspect ratio preservation
      const img = isPng
        ? await pdfDoc.embedPng(imgBytes)
        : await pdfDoc.embedJpg(imgBytes)

      // Get original image dimensions
      const originalWidth = img.width
      const originalHeight = img.height
      
      // Set maximum constraints
      const maxHeight = 180  // Maximum height in points
      const maxWidth = 280   // Maximum width in points
      
      // Calculate scale factor to maintain aspect ratio
      const scaleByHeight = maxHeight / originalHeight
      const scaleByWidth = maxWidth / originalWidth
      const scale = Math.min(scaleByHeight, scaleByWidth)
      
      // Calculate final dimensions
      const finalWidth = originalWidth * scale
      const finalHeight = originalHeight * scale

      // Center horizontally, place from top margin
      const imgX = (pageWidth - finalWidth) / 2
      const topMargin = 20
      const imgY = pageHeight - finalHeight - topMargin

      page.drawImage(img, {
        x: imgX,
        y: imgY,
        width: finalWidth,
        height: finalHeight,
      })

      // On first page, draw title
      if (i === 0) {
        const title = story.title.replace(/{name}/g, childName)
        page.drawText(title, {
          x: 30,
          y: imgY - 30, // 30pt below image
          size: 18,
          font: fontBold,
          color: rgb(0, 0, 0),
        })
      }

      // Draw story text for this specific page
      // Each page gets its corresponding paragraph from the content array
      const contentArray = Array.isArray(story.content) ? story.content : [story.content]
      const pageContent = contentArray[i] || contentArray[0] || '' // Fallback to first paragraph if not enough content
      const text = pageContent.replace(/{name}/g, childName)
      
      // Word wrap the text for this page
      const maxLineLength = 45
      const words = text.split(' ')
      let line = ''
      let textY = i === 0 ? imgY - 60 : imgY - 30 // More space on first page for title

      for (const word of words) {
        const testLine = line + (line === '' ? '' : ' ') + word
        
        if (testLine.length > maxLineLength && line !== '') {
          // Draw current line
          page.drawText(line, {
            x: 30,
            y: textY,
            size: 12,
            font: fontNormal,
            lineHeight: 14,
          })
          line = word
          textY -= 16 // Move to next line
        } else {
          line = testLine
        }

        // Prevent text from going below page margin
        if (textY < 50) {
          break
        }
      }

      // Draw last line if exists
      if (line && textY >= 50) {
        page.drawText(line, {
          x: 30,
          y: textY,
          size: 12,
          font: fontNormal,
          lineHeight: 14,
        })
      }

      // Add page number at bottom
      page.drawText(`Page ${i + 1} of ${story.pages}`, {
        x: pageWidth / 2 - 30,
        y: 15,
        size: 10,
        font: fontNormal,
        color: rgb(0.5, 0.5, 0.5),
      })
    }

    // 7. Serialize PDF and return
    const pdfBytes = await pdfDoc.save()
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${childName}-storybook.pdf"`,
      },
    })

  } catch (error) {
    console.error('PDF generation error:', error);
    let message = 'Unknown error';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      message = (error as any).message;
    }
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: message },
      { status: 500 }
    );
  }
}