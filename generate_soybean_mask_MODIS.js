
function generate_soybean_mask_MODIS(
  ROI,
  start_date_minNDVI, 
  end_date_minNDVI, 
  start_date_maxNDVI, 
  end_date_maxNDVI,
  lower_threshold,
  upper_threshold
  ){
    
  // NDVI palette
  var palette = ['ff0000','ffae35','4bca22','017e1c']

  // Obtain minimum NDVI image
  var minimum_NDVI_image = ee.ImageCollection("MODIS/006/MOD13Q1")
      .filterDate(start_date_minNDVI, end_date_minNDVI)
      .filterBounds(ROI)
      .map(function(image){
        return image
          .clip(ROI)        // Clip to geometry
          .select("NDVI")   // Select NDVI band
          .divide(10000)    // Apply band scale
      })
      .min()
  
  print("Minimum NDVI image", minimum_NDVI_image)
  Map.addLayer(minimum_NDVI_image, {min:-0.2, max:1, palette:palette}, 'Minimum NDVI image')
  
  
  /******************************************************************/
  // Obtain maximum NDVI image
  var maximum_NDVI_image = ee.ImageCollection("MODIS/006/MOD13Q1")
      .filterDate(start_date_maxNDVI, end_date_maxNDVI)
      .filterBounds(ROI)
      .map(function(image){
        return image
          .clip(ROI)        // Clip to geometry
          .select("NDVI")   // Select NDVI band
          .divide(10000)    // Apply band scale
      })
      .max()
      
  print("Maximum NDVI image", maximum_NDVI_image)
  Map.addLayer(maximum_NDVI_image, {min:-0.2, max:1, palette:palette}, 'Maximum NDVI image')
   
  
  /******************************************************************/
  // NDVI diff image
  var NDVI_diff_image = maximum_NDVI_image.subtract(minimum_NDVI_image)
  
  print("NDVI diff image", NDVI_diff_image)
  Map.addLayer(NDVI_diff_image, {}, 'NDVI diff image')
  
  
  
  /******************************************************************/
  // Generates soybean mask
  
  // Pixels from diff whose values are greater or equal than lower threshold
  var gte_lower_mask = NDVI_diff_image.gte(lower_threshold)
  // Pixels from diff whose values are less or equal than upper threshold
  var lte_upper_mask = NDVI_diff_image.lte(upper_threshold)
  // Logical operator AND
  var soybean_mask = gte_lower_mask.and(lte_upper_mask)
  // Reproject and self mask
  soybean_mask = soybean_mask
    .reproject('EPSG:4326', null, 250)
    .selfMask()
  
  print(soybean_mask)
  Map.addLayer(soybean_mask, {min:1,max:1,palette:['darkgreen']}, 'soybean_mask')
  
  
  /******************************************************************/
  // Compute the mask area
  
  // Obtain the number of mask pixels
  var count_mask_pixels = 
    ee.Number(
      soybean_mask.reduceRegion({
        reducer: ee.Reducer.sum(),
        geometry: ROI.geometry(),
        scale: 250,
        maxPixels: 1e9
      })
      .get('NDVI')
    )
    
  // Each pixel has 250m x 250m. Therefore, total area in m2 = 250*250*N
  var area_m2 = ee.Number(250).multiply(250).multiply(count_mask_pixels);
  var area_ha = area_m2.divide(1e4)
  
  return soybean_mask
}