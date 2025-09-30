// index.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const API_KEY = "zpka_8602db016259447d80f8908bbeac002e_570f2d8d"; // put your AccuWeather API key

// Generic endpoint for any city in South Africa
app.get("/weather", async (req, res) => {
  const city = req.query.city; // e.g., Durban, Cape Town, Johannesburg

  if (!city) return res.status(400).json({ error: "City is required" });

  try {
    // Step 1: Get location key for the city
    const locationResp = await axios.get(
      `http://dataservice.accuweather.com/locations/v1/cities/search`,
      {
        params: {
          apikey: API_KEY,
          q: city,
          // Optional: limit results to South Africa
          // In AccuWeather free tier, you can filter by country
          // We can filter manually below
        },
      }
    );

    if (!locationResp.data || locationResp.data.length === 0) {
      return res.status(404).json({ error: "City not found" });
    }

    // Filter to South Africa only
    const saLocation = locationResp.data.find(
      (loc) => loc.Country.ID === "ZA"
    );

    if (!saLocation) {
      return res.status(404).json({ error: "City not found in South Africa" });
    }

    const locationKey = saLocation.Key;

    // Step 2: Get current weather for this location key
    const weatherResp = await axios.get(
      `http://dataservice.accuweather.com/currentconditions/v1/${locationKey}`,
      {
        params: {
          apikey: API_KEY,
        },
      }
    );

    const weather = weatherResp.data[0]; // first item has current weather

    res.json({
      name: saLocation.LocalizedName,
      country: saLocation.Country.LocalizedName,
      temperature: weather.Temperature.Metric.Value,
      condition: weather.WeatherText,
      icon: weather.WeatherIcon,
      uv: weather.UVIndex, // may need to check API for UV property
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Weather fetch failed" });
  }
});

app.listen(PORT, () =>
  console.log(`AccuWeather API proxy running on http://localhost:${PORT}`)
);
