import { google } from 'googleapis';
import { oauthClient } from './../config/googleAuth.js';

const getUserGoogleInfo = async (req) => {
  const {code} = req.query;
  const {tokens} = await oauthClient.getToken(code);
  oauthClient.setCredentials(tokens);
  // instance untuk mengambil data user
  const oauth = google.oauth2({
    auth: oauthClient,
    version: 'v2'
  });
  const {data} = await oauth.userinfo.get();
  return data;
}

export default getUserGoogleInfo