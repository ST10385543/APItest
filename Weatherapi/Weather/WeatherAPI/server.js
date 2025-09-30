const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.send("🎉 AccuWeather API proxy is running!");
});

// Weather route
app.get("/weather", async (req, res) => {
  const city = req.query.city;
  const API_KEY = process.env.ACCUWEATHER_KEY;

  if (!city) return res.status(400).json({ error: "City is required" });

  try {
    // Get location key
    const locationResp = await axios.get(
      `http://dataservice.accuweather.com/locations/v1/cities/search`,
      {
        params: { apikey: API_KEY, q: city },
      }
    );

    if (!locationResp.data || locationResp.data.length === 0) {
      return res.status(404).json({ error: "City not found" });
    }

    // Filter South Africa
    const saLocation = locationResp.data.find((loc) => loc.Country.ID === "ZA");
    if (!saLocation) return res.status(404).json({ error: "City not in South Africa" });

    const locationKey = saLocation.Key;

    // Get current weather
    const weatherResp = await axios.get(
      `http://dataservice.accuweather.com/currentconditions/v1/${locationKey}`,
      { params: { apikey: API_KEY } }
    );

    const weather = weatherResp.data[0];

    res.json({
      name: saLocation.LocalizedName,
      country: saLocation.Country.LocalizedName,
      temperature: weather.Temperature.Metric.Value,
      condition: weather.WeatherText,
      icon: weather.WeatherIcon,
      uv: weather.UVIndex,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Weather fetch failed" });
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () =>
  console.log(`AccuWeather API proxy running on port ${PORT}`)
);
