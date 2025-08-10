import React from 'react';
import { WebView } from 'react-native-webview';

export default function OSMMapCenterPicker({ location, setLocation }) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; }
          .center-pin {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%);
            font-size: 28px;
            z-index: 1000;
            pointer-events: none;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="center-pin">📍</div>
        <script>
          var map = L.map('map', { center: [${location.latitude}, ${location.longitude}], zoom: 15 });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          // Listen for map move
          map.on('moveend', function() {
            var center = map.getCenter();
            window.ReactNativeWebView.postMessage(JSON.stringify(center));
          });
        </script>
      </body>
    </html>
  `;

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      onMessage={(event) => {
        const coords = JSON.parse(event.nativeEvent.data);
        setLocation({ latitude: coords.lat, longitude: coords.lng });
      }}
    />
  );
}
