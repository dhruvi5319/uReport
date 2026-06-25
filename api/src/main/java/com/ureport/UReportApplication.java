package com.ureport;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class UReportApplication {
    public static void main(String[] args) {
        SpringApplication.run(UReportApplication.class, args);
    }
}
