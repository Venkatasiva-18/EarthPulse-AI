package com.example.EarthPulseAI.service;

import com.example.EarthPulseAI.model.HistoricalData;
import com.example.EarthPulseAI.repository.HistoricalDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class HistoricalDataService {
    private final HistoricalDataRepository historicalDataRepository;

    @PostConstruct
    public void initData() {
        if (historicalDataRepository.count() == 0) {
            generateMockHistoricalData();
        }
    }

    private void generateMockHistoricalData() {
        String[] locations = {"Local Area", "City Center", "Industrial Zone"};
        int[] years = {2023, 2024, 2025};
        Random random = new Random();

        for (String loc : locations) {
            for (int year : years) {
                for (int month = 1; month <= 12; month++) {
                    HistoricalData data = new HistoricalData();
                    data.setLocation(loc);
                    data.setYear(year);
                    data.setMonth(month);
                    data.setRecordDate(LocalDate.of(year, month, 15));
                    
                    // Slightly increasing trend over years for simulation
                    int baseAqi = 80 + (year - 2023) * 10 + random.nextInt(30);
                    // Seasonal variation (higher in winter months)
                    if (month <= 2 || month >= 11) baseAqi += 40;
                    
                    data.setAvgAqi(baseAqi);
                    data.setPm25(baseAqi * 0.4 + random.nextDouble() * 10);
                    data.setPm10(baseAqi * 0.6 + random.nextDouble() * 15);
                    data.setNo2(baseAqi * 0.3 + random.nextDouble() * 5);
                    
                    historicalDataRepository.save(data);
                }
            }
        }
    }

    public List<HistoricalData> getHistoricalTrends(String location, List<Integer> years) {
        return historicalDataRepository.findByLocationAndYears(location, years);
    }
    
    public Map<Integer, Double> getYearlyAverages(String location) {
        List<Object[]> results = historicalDataRepository.findYearlyAverageAqi(location);
        Map<Integer, Double> averages = new HashMap<>();
        for (Object[] row : results) {
            averages.put((Integer) row[0], (Double) row[1]);
        }
        return averages;
    }
}
