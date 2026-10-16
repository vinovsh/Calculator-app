package com.everydaycalculator

import android.app.Activity
import android.content.Intent
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.ContentValues
import android.database.sqlite.SQLiteDatabase
import android.view.WindowManager
import com.facebook.react.bridge.*
import com.facebook.react.ReactPackage
import com.facebook.react.uimanager.ViewManager

class CalculatorPlatform(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context), ActivityEventListener {
  private val db: SQLiteDatabase by lazy {
    context.openOrCreateDatabase("everyday.db", Context.MODE_PRIVATE, null).also {
      it.execSQL("CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
    }
  }
  private var pending: Promise? = null
  private var exportText: String? = null
  init { context.addActivityEventListener(this) }
  override fun getName() = "CalculatorPlatform"
  @ReactMethod fun getItem(key: String, promise: Promise) {
    try { db.rawQuery("SELECT value FROM store WHERE key = ?", arrayOf(key)).use { promise.resolve(if(it.moveToFirst()) it.getString(0) else null) } }
    catch (e: Exception) { promise.reject("STORAGE", "Unable to read saved data", e) }
  }
  @ReactMethod fun setItem(key: String, value: String, promise: Promise) {
    try { val values=ContentValues().apply { put("key",key);put("value",value) };db.insertWithOnConflict("store",null,values,SQLiteDatabase.CONFLICT_REPLACE);promise.resolve(null) }
    catch(e:Exception){promise.reject("STORAGE","Unable to save data",e)}
  }
  @ReactMethod fun copy(text:String) { (context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(ClipData.newPlainText("Calculation",text)) }
  @ReactMethod fun keepAwake(enabled:Boolean) { currentActivity?.runOnUiThread { if(enabled) currentActivity?.window?.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) else currentActivity?.window?.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) } }
  @ReactMethod fun exportFile(name:String, type:String, text:String, promise:Promise) {
    val activity=currentActivity ?: run { promise.reject("ACTIVITY","Open the app to export");return }
    if(pending!=null){promise.reject("BUSY","Finish the current file operation first");return}
    pending=promise;exportText=text
    try { activity.startActivityForResult(Intent(Intent.ACTION_CREATE_DOCUMENT).apply { addCategory(Intent.CATEGORY_OPENABLE);setType(type);putExtra(Intent.EXTRA_TITLE,name) },7101) }
    catch(e:Exception){pending=null;exportText=null;promise.reject("EXPORT","No file picker available",e)}
  }
  @ReactMethod fun importFile(promise:Promise) {
    val activity=currentActivity ?: run { promise.reject("ACTIVITY","Open the app to restore");return }
    if(pending!=null){promise.reject("BUSY","Finish the current file operation first");return}
    pending=promise
    try { activity.startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).apply { addCategory(Intent.CATEGORY_OPENABLE);type="*/*";putExtra(Intent.EXTRA_MIME_TYPES,arrayOf("application/json","text/plain","application/octet-stream")) },7102) }
    catch(e:Exception){pending=null;promise.reject("IMPORT","No file picker available",e)}
  }
  override fun onActivityResult(activity: Activity, requestCode:Int, resultCode:Int, data:Intent?) {
    if(requestCode!=7101 && requestCode!=7102)return
    val p=pending ?: return;pending=null
    if(resultCode!=Activity.RESULT_OK || data?.data==null){exportText=null;p.resolve(null);return}
    try {
      val uri=data.data!!
      if(requestCode==7101){context.contentResolver.openOutputStream(uri,"wt")!!.bufferedWriter().use { it.write(exportText ?: "") };p.resolve(true)}
      else {val bytes=context.contentResolver.openInputStream(uri)!!.use { input ->
        val output=java.io.ByteArrayOutputStream();val buffer=ByteArray(8192)
        while(true){val count=input.read(buffer);if(count<0)break;output.write(buffer,0,count);if(output.size()>5_000_000)throw Exception("Backup exceeds 5 MB")}
        output.toByteArray()
      };if(bytes.size>5_000_000)throw Exception("Backup exceeds 5 MB");p.resolve(bytes.toString(Charsets.UTF_8))}
    }catch(e:Exception){p.reject("FILE", e.message ?: "File operation failed",e)}finally{exportText=null}
  }
  override fun onNewIntent(intent:Intent) {}
}
class CalculatorPlatformPackage: ReactPackage {
  override fun createNativeModules(context:ReactApplicationContext):List<NativeModule> = listOf(CalculatorPlatform(context))
  override fun createViewManagers(context:ReactApplicationContext):List<ViewManager<*,*>> = emptyList()
}
