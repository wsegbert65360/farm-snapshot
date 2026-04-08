// Test if AbortSignal.timeout() works in this environment
const url = 'https://api.open-meteo.com/v1/forecast?latitude=38.53&longitude=-93.52&hourly=precipitation_probability,precipitation&forecast_hours=24&timezone=America%2FChicago';

try {
  const controller = new AbortController();
  const signal = AbortSignal.timeout(10000);

  console.log('AbortSignal.timeout() created successfully');

  fetch(url, {
    headers: { 'User-Agent': 'Farm-Command/1.0' },
    signal: signal
  })
  .then(response => {
    console.log('Fetch completed!');
    console.log('Status:', response.status);
    console.log('OK:', response.ok);
    return response.json();
  })
  .then(data => {
    console.log('Data received!');
    console.log('Has hourly:', !!data.hourly);
    console.log('Success!');
  })
  .catch(error => {
    console.error('Error during fetch:', error.message);
  });
} catch (error) {
  console.error('Error creating AbortSignal:', error.message);
}
