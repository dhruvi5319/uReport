package com.ureport.util;

import com.ureport.dto.response.TicketSummaryResponse;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Streams ticket search results as CSV using Apache Commons CSV + StreamingResponseBody.
 * StreamingResponseBody prevents OOM on large exports by not buffering the full response.
 */
@Component
public class CsvExportUtil {

    private static final String[] HEADERS = {
        "id", "status", "substatus", "category", "description",
        "location", "city", "state", "zip", "enteredDate",
        "lastModified", "closedDate", "assignedPerson", "contactMethod"
    };

    /**
     * Returns a StreamingResponseBody that writes the ticket list as CSV.
     * Header row matches the HEADERS constant exactly.
     *
     * @param tickets list of tickets to export (may be empty — header row still written)
     * @return StreamingResponseBody for use with ResponseEntity
     */
    public StreamingResponseBody streamTicketsCsv(List<TicketSummaryResponse> tickets) {
        return outputStream -> {
            try (
                OutputStreamWriter writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);
                CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.builder()
                        .setHeader(HEADERS)
                        .build())
            ) {
                for (TicketSummaryResponse t : tickets) {
                    printer.printRecord(
                            t.getId(),
                            t.getStatus(),
                            t.getSubstatusName(),
                            t.getCategoryName(),
                            t.getDescription(),
                            t.getLocation(),
                            t.getCity(),
                            t.getState(),
                            t.getZip(),
                            t.getEnteredDate(),
                            t.getLastModified(),
                            t.getClosedDate(),
                            t.getAssignedPersonName(),
                            t.getContactMethodName()
                    );
                }
                printer.flush();
            } catch (IOException e) {
                throw new RuntimeException("Error writing CSV output", e);
            }
        };
    }
}
