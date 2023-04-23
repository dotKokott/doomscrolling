import { temperature } from "./temperatureData.js";

export class Temperature {
    yearlyAnomalies = []
    minYear
    maxYear
    minAnomaly = 0
    maxAnomaly = 0

    constructor(minYear, maxYear) {
        this.yearlyAnomalies = this.calculateYearlyAnomalies(temperature, 1880, 2024)
        console.log(this.yearlyAnomalies);
    }

    calculateYearlyAnomalies(data, startYear, endYear) {
        const yearlyAnomalies = [];
    


        for (let year = startYear; year <= endYear; year++) {
            const yearData = data.filter((item) => {
                const itemYear = Math.floor(parseFloat(item.time));
                return itemYear === year;
            });
    
            const avgAnomaly = yearData.reduce((sum, item) => {
                const anomaly = parseFloat(item.land);
                return sum + anomaly;
            }, 0) / yearData.length;
    
            if(avgAnomaly < this.minAnomaly) {
                this.minAnomaly = avgAnomaly;
            }

            if(avgAnomaly > this.maxAnomaly) {
                this.maxAnomaly = avgAnomaly;
            }            

            yearlyAnomalies.push({year: year, anomaly: avgAnomaly});
        }
    
        return yearlyAnomalies;
    }
}