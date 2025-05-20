package org.example;

import com.google.api.services.docs.v1.Docs;
import com.google.api.services.docs.v1.model.*;

import java.io.*;
import java.security.GeneralSecurityException;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException, GeneralSecurityException {
        Docs service = DocsServiceUtil.getDocsService();
        String documentId = "1-NTDSDVCSGjNPBI7qaoI3ux2FpUMIMq3U7pvjYs9saA";

        Document doc = service.documents().get(documentId).execute();
        java.util.List<StructuralElement> content = doc.getBody().getContent();

        Map<String, Map<String, String>> dataMap = new LinkedHashMap<>();
        Set<String> labels = new LinkedHashSet<>();

        String currentDate = null;

        for (StructuralElement el : content) {
            if (el.getParagraph() == null) continue;

            StringBuilder paragraphBuilder = new StringBuilder();
            for (ParagraphElement pe : el.getParagraph().getElements()) {
                TextRun run = pe.getTextRun();
                if (run != null) {
                    paragraphBuilder.append(run.getContent());
                }
            }

            String paragraphText = paragraphBuilder.toString().trim();

            // Debugging output
            System.out.println("Paragraph: \"" + paragraphText + "\"");

            String maybeDate = paragraphText.split(",")[0].trim();
            if (maybeDate.matches("\\d{1,2}/\\d{1,2}/\\d{4}")) {
                currentDate = maybeDate;
                dataMap.putIfAbsent(currentDate, new LinkedHashMap<>());
                System.out.println("Found date: " + currentDate);
            } else if (currentDate != null && paragraphText.contains(",")) {
                String[] parts = paragraphText.split(",", 2);
                if (parts.length == 2) {
                    String label = parts[0].trim();
                    String value = parts[1].trim();
                    dataMap.get(currentDate).put(label, value);
                    labels.add(label);
                    System.out.println("Added data - Date: " + currentDate + ", Label: " + label + ", Value: " + value);
                }
            }
        }

        try (BufferedWriter writer = new BufferedWriter(new FileWriter("docs/output.csv"))) {
            writer.write("Date");
            for (String label : labels) {
                writer.write("," + label);
            }
            writer.newLine();

            for (Map.Entry<String, Map<String, String>> entry : dataMap.entrySet()) {
                writer.write(entry.getKey());
                for (String label : labels) {
                    writer.write("," + entry.getValue().getOrDefault(label, ""));
                }
                writer.newLine();
            }
        }

        System.out.println("CSV writing complete. Labels: " + labels);
    }
}
