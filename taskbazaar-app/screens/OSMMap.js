import React from 'react';
import { WebView } from 'react-native-webview';

export default function OSMMap({ location, tasks = [], setLocation }) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${location.latitude}, ${location.longitude}], 14);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          // Blue marker for user location
          var userMarker = L.marker(
            [${location.latitude}, ${location.longitude}],
            { draggable: true, icon: L.icon({ iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png', iconSize: [32, 32] }) }
          ).addTo(map);

          userMarker.on('dragend', function(e) {
            var coords = e.target.getLatLng();
            window.ReactNativeWebView.postMessage(JSON.stringify(coords));
          });

          // Task markers
          var tasks = ${JSON.stringify(tasks)};
          tasks.forEach(task => {
            L.marker([task.location.coordinates[1], task.location.coordinates[0]])
              .addTo(map)
              .bindPopup('<b>' + task.title + '</b><br>' + task.description);
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
