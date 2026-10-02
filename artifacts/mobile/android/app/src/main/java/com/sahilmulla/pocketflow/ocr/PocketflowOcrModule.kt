package com.sahilmulla.pocketflow.ocr

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import com.facebook.react.bridge.*
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.io.File

class PocketflowOcrModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PocketflowOcr"

    @ReactMethod
    fun recognizeText(imageUriString: String, promise: Promise) {
        try {
            val uri = Uri.parse(imageUriString)
            var bitmap: Bitmap? = null

            if (uri.scheme == "content") {
                bitmap = decodeSampledBitmapFromUri(uri)
            } else if (uri.scheme == "file" || uri.scheme == null) {
                // Try resolving as file path first
                val path = uri.path ?: imageUriString
                val file = File(path)
                if (file.exists()) {
                    bitmap = decodeSampledBitmapFromFile(file)
                } else {
                    // Fallback to URI resolution
                    bitmap = decodeSampledBitmapFromUri(uri)
                }
            } else {
                val file = File(imageUriString)
                if (file.exists()) {
                    bitmap = decodeSampledBitmapFromFile(file)
                }
            }

            if (bitmap == null) {
                promise.reject("OCR_ERROR", "Failed to decode image into bitmap")
                return
            }

            val inputImage = InputImage.fromBitmap(bitmap, 0)
            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
            
            recognizer.process(inputImage)
                .addOnSuccessListener { visionText ->
                    val result = Arguments.createMap()
                    result.putString("text", visionText.text)

                    val blocksArray = Arguments.createArray()
                    for (block in visionText.textBlocks) {
                        val blockMap = Arguments.createMap()
                        blockMap.putString("text", block.text)
                        val linesArray = Arguments.createArray()
                        for (line in block.lines) {
                            val lineMap = Arguments.createMap()
                            lineMap.putString("text", line.text)
                            linesArray.pushMap(lineMap)
                        }
                        blockMap.putArray("lines", linesArray)
                        blocksArray.pushMap(blockMap)
                    }
                    result.putArray("blocks", blocksArray)
                    promise.resolve(result)
                }
                .addOnFailureListener { e ->
                    promise.reject("OCR_ERROR", e.message, e)
                }
        } catch (e: Exception) {
            promise.reject("OCR_INIT_ERROR", e.message, e)
        }
    }

    private fun decodeSampledBitmapFromUri(uri: Uri): Bitmap? {
        val context = reactApplicationContext
        
        val options = BitmapFactory.Options()
        options.inJustDecodeBounds = true
        try {
            context.contentResolver.openInputStream(uri)?.use {
                BitmapFactory.decodeStream(it, null, options)
            }
        } catch (e: Exception) {
            return null
        }
        
        options.inSampleSize = calculateInSampleSize(options, 2048)
        options.inJustDecodeBounds = false
        
        val bitmap = try {
            context.contentResolver.openInputStream(uri)?.use {
                BitmapFactory.decodeStream(it, null, options)
            }
        } catch (e: Exception) {
            null
        }
        
        if (bitmap == null) return null
        
        var rotatedBitmap = bitmap
        try {
            context.contentResolver.openInputStream(uri)?.use {
                val exif = ExifInterface(it)
                val orientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
                rotatedBitmap = rotateBitmap(bitmap, orientation)
            }
        } catch (e: Exception) {
            // Ignore EXIF errors
        }
        
        return rotatedBitmap
    }

    private fun decodeSampledBitmapFromFile(file: File): Bitmap? {
        val options = BitmapFactory.Options()
        options.inJustDecodeBounds = true
        BitmapFactory.decodeFile(file.absolutePath, options)
        
        options.inSampleSize = calculateInSampleSize(options, 2048)
        options.inJustDecodeBounds = false
        
        val bitmap = BitmapFactory.decodeFile(file.absolutePath, options)
        
        if (bitmap == null) return null
        
        var rotatedBitmap = bitmap
        try {
            val exif = ExifInterface(file.absolutePath)
            val orientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
            rotatedBitmap = rotateBitmap(bitmap, orientation)
        } catch (e: Exception) {
            // Ignore EXIF errors
        }
        
        return rotatedBitmap
    }

    private fun calculateInSampleSize(options: BitmapFactory.Options, maxDimension: Int): Int {
        val height = options.outHeight
        val width = options.outWidth
        var inSampleSize = 1

        if (height > maxDimension || width > maxDimension) {
            val halfHeight = height / 2
            val halfWidth = width / 2

            while (halfHeight / inSampleSize >= maxDimension || halfWidth / inSampleSize >= maxDimension) {
                inSampleSize *= 2
            }
        }
        return inSampleSize
    }

    private fun rotateBitmap(bitmap: Bitmap, orientation: Int): Bitmap {
        val matrix = Matrix()
        when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
            ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.preScale(-1.0f, 1.0f)
            ExifInterface.ORIENTATION_FLIP_VERTICAL -> {
                matrix.preScale(1.0f, -1.0f)
                matrix.postRotate(180f)
            }
            ExifInterface.ORIENTATION_TRANSPOSE -> {
                matrix.preScale(-1.0f, 1.0f)
                matrix.postRotate(90f)
            }
            ExifInterface.ORIENTATION_TRANSVERSE -> {
                matrix.preScale(-1.0f, 1.0f)
                matrix.postRotate(270f)
            }
            else -> return bitmap
        }
        
        return try {
            val rotated = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
            if (rotated != bitmap) {
                bitmap.recycle()
            }
            rotated
        } catch (e: Exception) {
            bitmap
        }
    }
}
