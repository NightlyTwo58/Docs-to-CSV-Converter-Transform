package org.example;

import com.google.api.services.docs.v1.Docs;
import com.google.api.services.docs.v1.model.*;

import java.io.*;
import java.security.GeneralSecurityException;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException, GeneralSecurityException {
        // domestic electoral parties
        sort("1-NTDSDVCSGjNPBI7qaoI3ux2FpUMIMq3U7pvjYs9saA", "docs/output.csv");

        // parental influence
        sortParental("1DJNfTQZuCNol0OyO6KyeQJWuHudkqCwVYkSKgVBF8Sc", "docs/outputPar.csv");
    }

    public static void sort(String documentId, String outputId) throws IOException, GeneralSecurityException {
        Docs service = DocsServiceUtil.getDocsService();
        Document doc = service.documents().get(documentId).execute();
        java.util.List<StructuralElement> content = doc.getBody().getContent();

        Map<String, Map<String, String>> dataMap = new LinkedHashMap<>();
        Map<String, String[]> coalitionMap = new LinkedHashMap<>();
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


            String[] dateAndCoalition = paragraphText.split(",");
            if (dateAndCoalition.length == 1) continue;
            System.out.println("date + coalition: " + paragraphText + dateAndCoalition.length);
            String maybeDate = paragraphText.split(",")[0].trim();
            String maybeCoalition = paragraphText.split(",")[1].trim();
            // we can add a check for valid coalitions

            if (maybeDate.matches("\\d{1,2}/\\d{1,2}/\\d{4}")) {
                currentDate = maybeDate;
                dataMap.putIfAbsent(currentDate, new LinkedHashMap<>());

                if (maybeCoalition.matches("\\D+(-\\D+)*")) {
                    String[] coalitionMembers = maybeCoalition.split("-");
                    coalitionMap.putIfAbsent(currentDate, coalitionMembers);
                }
                System.out.println("Found date: " + currentDate);
            } else if (currentDate != null && paragraphText.contains(",")) {
                String[] parts = paragraphText.split(",", 2);
                if (parts.length == 2) {
                    String label = parts[0].trim();
                    String value = parts[1].replaceAll(",+$", "").trim();
                    dataMap.get(currentDate).put(label, value);
                    labels.add(label);
                    System.out.println("Added data - Date: " + currentDate + ", Label: " + label + ", Value: " + value);
                }
            }
        }

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(outputId))) {
            writer.write("Date");
            for (String label : labels) {
                writer.write("," + label);
            }
            writer.write("," + "Coalitions");
            writer.newLine();

            for (Map.Entry<String, Map<String, String>> entry : dataMap.entrySet()) {
                writer.write(entry.getKey());
                for (String label : labels) {
                    writer.write("," + entry.getValue().getOrDefault(label, "0"));
                }
                String date = entry.getKey();
                if (coalitionMap.containsKey(date)) {
                    writer.write("," + String.join("-", coalitionMap.get(date)));
                } else {
                    writer.write(",");
                }
                writer.newLine();
            }
        }

        System.out.println("CSV writing complete. Labels: " + labels);
    }

    public static void sortParental(String documentId, String outputId) throws IOException, GeneralSecurityException {
        Docs service = DocsServiceUtil.getDocsService();
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

            String maybeDate = paragraphText.split(",")[0].trim();
            if (maybeDate.matches("\\d{1,2}/\\d{1,2}/\\d{4}")) {
                currentDate = maybeDate;
                dataMap.putIfAbsent(currentDate, new LinkedHashMap<>());
            } else if (currentDate != null && paragraphText.contains(",")) {
                String[] parts = paragraphText.split(",", 2);
                if (parts.length == 2) {
                    String label = parts[0].trim();
                    String value = parts[1].replaceAll(",+$", "").trim();
                    dataMap.get(currentDate).put(label, value);
                    labels.add(label);
                }
            }
        }

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(outputId))) {
            writer.write("Date");
            for (String label : labels) {
                writer.write("," + label);
            }
            writer.newLine();

            for (Map.Entry<String, Map<String, String>> entry : dataMap.entrySet()) {
                writer.write(entry.getKey());
                for (String label : labels) {
                    writer.write("," + entry.getValue().getOrDefault(label, "0"));
                }
                writer.newLine();
            }
        }
    }
}
