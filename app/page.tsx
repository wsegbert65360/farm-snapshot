import GrainCard from "@/components/GrainCard";
import WeatherCard from "@/components/WeatherCard";
import SprayCard from "@/components/SprayCard";
import ForecastCard from "@/components/ForecastCard";
import NewsCard from "@/components/NewsCard";
import UpdateButton from "@/components/UpdateButton";
// FEATURE: SunriseSunset — delete this import + render block to remove
import SunriseSunsetCard from "@/components/SunriseSunsetCard";
import { fetchCurrentWeather, fetchDailyForecast } from "@/lib/weather";
import { fetchRainfall } from "@/lib/rainfall";
import { calculateSprayDecision } from "@/lib/spray";
import { fetchGrainPrices } from "@/lib/grain";
import { fetchFarmNews } from "@/lib/news";
// FEATURE: SunriseSunset — delete this import + render block to remove
import { fetchSunriseSunset } from "@/lib/sunrise-sunset";
// FEATURE: Radar — delete this import + render block to remove
import RadarCard from "@/components/RadarCard";
import { fetchRadar } from "@/lib/radar";
// FEATURE: SoilTemp — delete this import + render block to remove
import SoilTempCard from "@/components/SoilTempCard";
import { fetchSoilTemp } from "@/lib/soil-temp";
// FEATURE: DewPoint — delete this import + render block to remove
import DewPointCard from "@/components/DewPointCard";
import { fetchDewPoint } from "@/lib/dew-point";
// FEATURE: GrowingDegreeDays — delete this import + render block to remove
import GrowingDegreeDaysCard from "@/components/GrowingDegreeDaysCard";
import { fetchGDD } from "@/lib/growing-degree-days";
// FEATURE: FrostAlert — delete this import + render block to remove
import FrostAlertCard from "@/components/FrostAlertCard";
import { fetchFrostAlert } from "@/lib/frost-alert";
// FEATURE: Barometer — delete this import + render block to remove
import BarometerCard from "@/components/BarometerCard";
import { fetchBarometer } from "@/lib/barometer";
// FEATURE: SprayDayPlanner — delete this import + render block to remove
import SprayDayPlannerCard from "@/components/SprayDayPlannerCard";
import { fetchSprayDayPlanner } from "@/lib/spray-day-planner";
import { config } from "@/lib/config";

export const revalidate = 900;

type WeatherData = Awaited<ReturnType<typeof fetchCurrentWeather>>;

async function getWeatherData(weather: WeatherData) {
  const rainfall = await fetchRainfall();

  // Only error if the weather API itself failed, not if optional rainfall is unconfigured
  const hasError = weather.error;

  return {
    locationLabel: config.weather.locationLabel,
    rain1d: rainfall.rain1d,
    rain3d: rainfall.rain3d,
    rain7d: rainfall.rain7d,
    windMph: weather.windMph,
    gustMph: weather.gustMph,
    tempF: weather.tempF,
    isRainingNow: weather.isRainingNow ?? false,
    rainPredicted: weather.rainPredicted ?? false,
    error: hasError ? "Data unavailable" : undefined,
    updatedAt: new Date().toISOString(),
  };
}

function getSprayData(weather: WeatherData) {
  if (weather.error || weather.windMph === null) {
    return {
      status: "WAIT" as const,
      reason: "Weather data unavailable",
      windMph: 0,
      gustMph: null,
      thresholds: { maxWindMph: config.spray.maxWindMph, maxGustMph: config.spray.maxGustMph },
      updatedAt: new Date().toISOString(),
    };
  }

  return calculateSprayDecision({
    windMph: weather.windMph,
    gustMph: weather.gustMph,
    isRainingNow: weather.isRainingNow ?? false,
    rainPredicted: weather.rainPredicted ?? false,
  });
}

export default async function Home() {
  // FEATURE: SunriseSunset — delete this fetchSunriseSunset from Promise.all to remove
  // FEATURE: Radar — delete this fetchRadar from Promise.all to remove
  // FEATURE: SoilTemp — delete this fetchSoilTemp from Promise.all to remove
  // FEATURE: DewPoint — delete this fetchDewPoint from Promise.all to remove
  // FEATURE: GrowingDegreeDays — delete this fetchGDD from Promise.all to remove
  // FEATURE: FrostAlert — delete this fetchFrostAlert from Promise.all to remove
  // FEATURE: Barometer — delete this fetchBarometer from Promise.all to remove
  // FEATURE: SprayDayPlanner — delete this fetchSprayDayPlanner from Promise.all to remove
  const [weather, grainData, forecast, newsData, sunriseSunsetData, radarData, soilTempData, dewPointData, gddData, frostData, barometerData, sprayPlannerData] = await Promise.all([
    fetchCurrentWeather(),
    fetchGrainPrices(),
    fetchDailyForecast(10),
    fetchFarmNews(),
    fetchSunriseSunset(),
    fetchRadar(),
    fetchSoilTemp(),
    fetchDewPoint(),
    fetchGDD(),
    fetchFrostAlert(),
    fetchBarometer(),
    fetchSprayDayPlanner(),
  ]);

  const [weatherData, sprayData] = await Promise.all([
    getWeatherData(weather),
    Promise.resolve(getSprayData(weather)),
  ]);

  const hasAnyError = weatherData.error || sprayData.reason.includes("unavailable");

  return (
    <main className="space-y-2">
      <GrainCard data={grainData} />
      <WeatherCard data={weatherData} />
      <SprayCard data={sprayData} />
      {/* FEATURE: SunriseSunset — delete this block to remove */}
      <SunriseSunsetCard
        sunrise={sunriseSunsetData.sunrise}
        sunset={sunriseSunsetData.sunset}
        daylightMinutes={sunriseSunsetData.daylightMinutes}
        error={sunriseSunsetData.error}
      />
      {/* END FEATURE: SunriseSunset */}
      {/* FEATURE: Radar — delete this block to remove */}
      <RadarCard
        mapTiles={radarData.mapTiles}
        radarTiles={radarData.radarTiles}
        frameTime={radarData.frameTime}
        markerX={radarData.markerX}
        markerY={radarData.markerY}
        error={radarData.error}
      />
      {/* END FEATURE: Radar */}
      {/* FEATURE: SoilTemp — delete this block to remove */}
      <SoilTempCard
        surfaceF={soilTempData.surfaceF}
        sixInchF={soilTempData.sixInchF}
        eighteenInchF={soilTempData.eighteenInchF}
        fourFootF={soilTempData.fourFootF}
        error={soilTempData.error}
      />
      {/* END FEATURE: SoilTemp */}
      {/* FEATURE: DewPoint — delete this block to remove */}
      <DewPointCard
        tempF={dewPointData.tempF}
        dewPointF={dewPointData.dewPointF}
        humidity={dewPointData.humidity}
        comfort={dewPointData.comfort}
        sprayNote={dewPointData.sprayNote}
        error={dewPointData.error}
      />
      {/* END FEATURE: DewPoint */}
      {/* FEATURE: GrowingDegreeDays — delete this block to remove */}
      <GrowingDegreeDaysCard
        todayGDD={gddData.todayGDD}
        seasonGDD={gddData.seasonGDD}
        soySeasonGDD={gddData.soySeasonGDD}
        weekGDD={gddData.weekGDD}
        dailyGDD={gddData.dailyGDD}
        error={gddData.error}
      />
      {/* END FEATURE: GrowingDegreeDays */}
      {/* FEATURE: FrostAlert — delete this block to remove */}
      <FrostAlertCard
        days={frostData.days}
        alertLevel={frostData.alertLevel}
        summary={frostData.summary}
        error={frostData.error}
      />
      {/* END FEATURE: FrostAlert */}
      {/* FEATURE: Barometer — delete this block to remove */}
      <BarometerCard
        pressureInHg={barometerData.pressureInHg}
        trend={barometerData.trend}
        changeHpa={barometerData.changeHpa}
        forecast={barometerData.forecast}
        error={barometerData.error}
      />
      {/* END FEATURE: Barometer */}
      {/* FEATURE: SprayDayPlanner — delete this block to remove */}
      <SprayDayPlannerCard
        days={sprayPlannerData.days}
        goodDaysCount={sprayPlannerData.goodDaysCount}
        totalDays={sprayPlannerData.totalDays}
        error={sprayPlannerData.error}
      />
      {/* END FEATURE: SprayDayPlanner */}
      <ForecastCard days={forecast.days} updatedAt={new Date().toISOString()} />
      <NewsCard data={newsData} />
      {hasAnyError && (
        <p className="text-center text-xs text-red-500">
          ⚠️ API connections down — weather or spray data unavailable
        </p>
      )}
      <div className="pt-3 pb-4">
        <UpdateButton />
      </div>
    </main>
  );
}
