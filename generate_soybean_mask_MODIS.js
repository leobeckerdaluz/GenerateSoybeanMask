
exports.generate_soybean_mask_MODIS = function(
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
      
  
  /******************************************************************/
  // NDVI diff image
  var NDVI_diff_image = maximum_NDVI_image.subtract(minimum_NDVI_image)
  
  
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
  
  // Return min and max NDVI images, soybean mask and mask area (ha)
  return ee.List([
    minimum_NDVI_image, 
    maximum_NDVI_image, 
    soybean_mask, 
    area_ha
  ])
}