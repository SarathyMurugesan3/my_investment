package com.example.demo.watermark;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

@Service
public class PdfWatermarkService {
	
	public byte[] addWatermark(String filePath,String watermarkText) throws IOException {
		PDDocument document = PDDocument.load(new File(filePath));
		for(PDPage page : document.getPages()) {
			PDRectangle pageSize = page.getMediaBox();
			PDPageContentStream contentStream = new PDPageContentStream(document,page,PDPageContentStream.AppendMode.APPEND,true);
			contentStream.beginText();
			contentStream.setFont(PDType1Font.HELVETICA_BOLD, 40);
			contentStream.setNonStrokingColor(200,200,200);
			contentStream.newLineAtOffset(pageSize.getWidth()/4, pageSize.getHeight()/2);
			contentStream.showText(watermarkText);
			contentStream.endText();
			contentStream.close();
		}
		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		document.save(outputStream);
		document.close();
		return outputStream.toByteArray();
	}
	
	
	
	
}
