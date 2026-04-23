import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudDrizzle, CloudSnow, Zap, Thermometer } from 'lucide-react';
import styles from './Weather.module.css';

const CITY = 'Duque de Caxias';

function getIcon(code, size = 20) {
  if (code <= 1) return <Sun size={size} />;
  if (code <= 3) return <Cloud size={size} />;
  if (code <= 67) return <CloudRain size={size} />;
  if (code <= 77) return <CloudSnow size={size} />;
  if (code <= 82) return <CloudDrizzle size={size} />;
  if (code <= 99) return <Zap size={size} />;
  return <Sun size={size} />;
}

function getCondition(code) {
  if (code === 0) return 'Céu limpo';
  if (code <= 1) return 'Predomin. limpo';
  if (code <= 3) return 'Nublado';
  if (code <= 48) return 'Neblina';
  if (code <= 67) return 'Chuvoso';
  if (code <= 77) return 'Neve';
  if (code <= 82) return 'Garoa';
  if (code <= 99) return 'Trovoada';
  return 'Variável';
}

const Weather = () => {
  const [weather, setWeather] = useState({ temp: '--', condition: 'Carregando...', icon: <Sun size={20} /> });
  const [error, setError] = useState(false);

  const fetchWeather = () => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=-22.7856&longitude=-43.3117&current=temperature_2m,weathercode&timezone=America%2FSao_Paulo')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        const temp = Math.round(data.current.temperature_2m);
        const code = data.current.weathercode;
        setWeather({ temp, condition: getCondition(code), icon: getIcon(code) });
        setError(false);
      })
      .catch(() => {
        setError(true);
        setWeather({ temp: '--', condition: 'Indisponível', icon: <Thermometer size={20} /> });
      });
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000); // atualiza a cada 10 minutos
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.iconArea}>
        {weather.icon}
      </div>
      <div className={styles.info}>
        <div className={styles.mainRow}>
          <span className={styles.temp}>{weather.temp}°C</span>
          <span className={styles.condition}>{weather.condition}</span>
        </div>
        <span className={styles.city}>{CITY}</span>
      </div>
      <div className={styles.thermo}>
        <Thermometer size={16} />
      </div>
    </div>
  );
};

export default Weather;
