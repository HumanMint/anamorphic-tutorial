import Papa from 'papaparse';

export const loadCameraData = async () => {
  const response = await fetch('https://raw.githubusercontent.com/humanmint/atlas-vision/main/public/data/cameras.csv');
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const brands = {};
        results.data.forEach(row => {
          if (!row.Brand || !row.Model) return;
          if (!brands[row.Brand]) brands[row.Brand] = {};
          if (!brands[row.Brand][row.Model]) brands[row.Brand][row.Model] = [];
          
          brands[row.Brand][row.Model].push({
            name: row.Mode,
            width: parseFloat(row.Width),
            height: parseFloat(row.Height),
            resolution: row.Resolution,
            nativeAnamorphic: row.NativeAnamorphic === 'True',
            supportedSqueezes: row.SupportedSqueezes ? row.SupportedSqueezes.split(';').map(s => parseFloat(s)) : []
          });
        });
        resolve(brands);
      },
      error: (error) => reject(error)
    });
  });
};
