
// Define ROI
var ROI = ee.FeatureCollection("users/grazielirodigheri/Shapes/Mesorregiao-RS")
Map.centerObject(ROI);
Map.addLayer(ROI)

// Data range for minimum MODIS NDVI image
var start_date_minNDVI = '2017-11-01'
var end_date_minNDVI = '2017-12-04'

// Data range for maximum MODIS NDVI image
var start_date_maxNDVI = '2018-01-16'
var end_date_maxNDVI = '2018-02-28'

// Parameters for soybean mask generation
var lower_threshold = 0.41
var upper_threshold = 0.71



// Generate soybean mask
var GenerateSoybeanMask = require('users/leobeckerdaluz/GenerateSoybeanMask:generate_soybean_mask_MODIS');

var soybean_mask_results = GenerateSoybeanMask.generate_soybean_mask_MODIS(
  ROI,
  start_date_minNDVI, 
  end_date_minNDVI, 
  start_date_maxNDVI, 
  end_date_maxNDVI,
  lower_threshold,
  upper_threshold
)

// generate soybean mask function returns 4 objects (1-minimum NDVI image,
// ...2-maximum NDVI image, 3-soybean mask and 4-mask area in ha).
var min_NDVI_image  = ee.Image(soybean_mask_results.get(0))
var max_NDVI_image  = ee.Image(soybean_mask_results.get(1))
var soybean_mask    = ee.Image(soybean_mask_results.get(2))
var area_ha         = ee.Number(soybean_mask_results.get(3))

print("Soybean Mask Area (ha):", area_ha)

var mask_download_url = soybean_mask.getDownloadURL({name:'soybean_mask', region:ROI.geometry()})
print("Soybean Mask:", soybean_mask, mask_download_url)
Map.addLayer(soybean_mask, {min:0, max:1, palette:['darkgreen']}, 'Soybean Mask')
