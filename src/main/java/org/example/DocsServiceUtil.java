package org.example;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.docs.v1.Docs;
import com.google.api.services.docs.v1.DocsScopes;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.util.store.FileDataStoreFactory;

import java.io.*;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.List;

public class DocsServiceUtil {
    private static final String APPLICATION_NAME = "CSV Notes Exporter";
    private static final File TOKENS_DIR = new File("tokens");
    private static final List<String> SCOPES = Collections.singletonList(DocsScopes.DOCUMENTS_READONLY);
    private static final File CREDENTIALS_FILE = new File("credentials.json");

    public static Docs getDocsService() throws IOException, GeneralSecurityException {
        var httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        var jsonFactory = GsonFactory.getDefaultInstance();

        Credential credential = new AuthorizationCodeInstalledApp(
                new GoogleAuthorizationCodeFlow.Builder(
                        httpTransport, jsonFactory,
                        GoogleClientSecrets.load(jsonFactory, new FileReader(CREDENTIALS_FILE)),
                        SCOPES
                ).setDataStoreFactory(new FileDataStoreFactory(TOKENS_DIR)).build(),
                new LocalServerReceiver()
        ).authorize("user");

        return new Docs.Builder(httpTransport, jsonFactory, credential)
                .setApplicationName(APPLICATION_NAME)
                .build();
    }
}
