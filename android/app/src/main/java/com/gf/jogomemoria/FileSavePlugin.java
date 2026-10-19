package com.gf.jogomemoria;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;

@CapacitorPlugin(name = "FileSavePlugin")
public class FileSavePlugin extends Plugin {

    @PluginMethod
    public void saveFile(PluginCall call) {
        String fileName = call.getString("fileName");
        String mimeType = call.getString("mimeType", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        String base64Data = call.getString("data");

        if (fileName == null || base64Data == null) {
            call.reject("Nome do arquivo e dados em base64 são obrigatórios.");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mimeType);
        intent.putExtra(Intent.EXTRA_TITLE, fileName);

        startActivityForResult(call, intent, "handleSaveResult");
    }

    @ActivityCallback
    private void handleSaveResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        if (result.getResultCode() == Activity.RESULT_OK) {
            Intent data = result.getData();
            if (data != null && data.getData() != null) {
                Uri uri = data.getData();
                String base64Data = call.getString("data");
                if (base64Data == null) {
                    call.reject("Dados do arquivo ausentes.");
                    return;
                }

                try (OutputStream os = getContext().getContentResolver().openOutputStream(uri)) {
                    if (os == null) {
                        call.reject("Não foi possível abrir o destino para gravação.");
                        return;
                    }
                    byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
                    os.write(bytes);
                    os.flush();

                    JSObject ret = new JSObject();
                    ret.put("uri", uri.toString());
                    ret.put("status", "SUCCESS");
                    call.resolve(ret);
                } catch (Exception e) {
                    call.reject("Erro ao gravar o arquivo no dispositivo: " + e.getMessage());
                }
            } else {
                call.reject("Nenhum local de destino selecionado.");
            }
        } else if (result.getResultCode() == Activity.RESULT_CANCELED) {
            JSObject ret = new JSObject();
            ret.put("status", "CANCELLED");
            call.resolve(ret);
        } else {
            call.reject("Operação finalizada com código: " + result.getResultCode());
        }
    }
}
