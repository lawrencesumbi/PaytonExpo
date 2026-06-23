// app/(spenderTabs)/scan.tsx
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function ScanReceiptScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const cameraRef = useRef<any>(null);

  // Check ug pangayo og permiso sa camera
  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#0CD964" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { padding: 20 }]}>
        <Ionicons name="camera-outline" size={64} color="#7DA08E" />
        <Text style={styles.permissionText}>Gikinahanglan ang Camera Permission</Text>
        <Text style={styles.permissionSub}>Aron maka-scan og resibo para sa Payton, palihog og tugot sa paggamit sa camera.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Tuguti ang Camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // FUNCTION INIG PISLIT SA SCAN BUTTON
  const handleTakePicture = async () => {
    if (cameraRef.current && !scanning) {
      try {
        setScanning(true);
        
        // 1. Pagkuha sa hulagway gikan sa camera view
        const options = { quality: 0.5, base64: true, skipProcessing: false };
        const photo = await cameraRef.current.takePictureAsync(options);

        if (!photo.base64) {
          throw new Error("Wala makuha ang base64 data sa hulagway.");
        }

        // 2. I-send ang hulagway ngadto sa usa ka Libre nga OCR Engine (OCR.space API)
        // Note: Pwede ka mokuha og kaugalingong libre nga API Key sa ocr.space, default karon kay 'helloworld'
        const formData = new FormData();
        formData.append('base64Image', `data:image/jpg;base64,${photo.base64}`);
        formData.append('language', 'eng');
        formData.append('isOverlayRequired', 'false');
        formData.append('filetype', 'JPG');

        const response = await fetch('https://api.ocr.space/parse/image', {
          method: 'POST',
          headers: {
            'apikey': 'helloworld', // Pwede ra ni nimo ilisan sa imong kaugalingong libre nga key puhon
          },
          body: formData,
        });

        const jsonResult = await response.json();
        
        if (jsonResult.OCRExitCode === 1) {
          const parsedText = jsonResult.ParsedResults[0].ParsedText;
          
          // 3. Simple Regex Analysis para pangitaon ang TOTAL ug kantidad sa resibo
          const extractedInfo = parseReceiptText(parsedText);

          Alert.alert(
            "Scan Success 🎉",
            `Ngalan: ${extractedInfo.name}\nKantidad: ₱${extractedInfo.amount}`,
            [
              {
                text: "I-sulod sa Form",
                onPress: () => {
                  // I-pasa nato ang nakuha nga data ngadto sa imong expenses screen pinaagi sa URL parameters
                  router.push({
                    pathname: '/expenses',
                    params: { 
                      scannedName: extractedInfo.name, 
                      scannedAmount: extractedInfo.amount.toString() 
                    }
                  });
                }
              },
              { text: "Sulayan Pag-usab", style: "cancel" }
            ]
          );
        } else {
          Alert.alert("Scan Failed ❌", "Dili klaro ang teksto sa resibo. Palihog og sulay pag-usab sa mas hayag nga dapit.");
        }

      } catch (error: any) {
        Alert.alert("OCR Error", "Naay problema sa pag-proseso sa resibo: " + error.message);
      } finally {
        setScanning(false);
      }
    }
  };

  // HELPER FUNCTION PARA MO-PARS UG MO-EXTRACT OG NUMERO GIKAN SA TEKSTO
  const parseReceiptText = (text: string): { name: string; amount: number } => {
    // I-split kada linya para masusi
    const lines = text.split('\n');
    let detectedAmount = 0.00;
    let detectedName = "Scanned Receipt";

    // Regex para mangita og kwarta/decimals (e.g., 150.00, 45.50)
    const amountRegex = /(?:total|amount|due|cash|php|p|₱)\s*[:=]?\s*([\d,]+\.\d{2})/i;

    for (let line of lines) {
      const match = line.match(amountRegex);
      if (match) {
        const cleanAmount = match[1].replace(/,/g, '');
        const val = parseFloat(cleanAmount);
        if (val > detectedAmount) {
          detectedAmount = val; // Kuhaon ang pinakadakong total sa resibo
        }
      }
    }

    // Kon naay nakit-an nga unang linya nga naay ngalan sa tindahan, himoon natong name
    if (lines.length > 0 && lines[0].trim().length > 3) {
      detectedName = lines[0].trim().substring(0, 20); // Limit sa 20 characters
    }

    return { name: detectedName, amount: detectedAmount || 0 };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera Core Component */}
      <CameraView style={styles.camera} ref={cameraRef}>
        
        {/* Transparent Mask / Frame Effect para sa Resibo */}
        <View style={styles.overlayContainer}>
          <Text style={styles.instructionText}>I-sentro ang Resibo sulod sa kahon</Text>
          <View style={styles.scanTargetBox} />
          <Text style={styles.subInstructionText}>Siguroha nga hayag ug klaro ang mga numero</Text>
        </View>

        {/* Action Bottom Layout */}
        <View style={styles.buttonContainer}>
          {scanning ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Gi-analisar ang Resibo...</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.captureButton} onPress={handleTakePicture}>
              <View style={styles.innerCaptureButton} />
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  camera: { flex: 1, justifyContent: 'space-between' },
  
  // Custom Scanner Overlay Mask
  overlayContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: 20 },
  instructionText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10 },
  scanTargetBox: { width: width * 0.75, height: width * 1.1, borderWidth: 2, borderColor: '#0CD964', borderRadius: 12, backgroundColor: 'transparent' },
  subInstructionText: { color: '#7DA08E', fontSize: 12, marginTop: 20, textAlign: 'center', fontWeight: '500' },
  
  // Trigger Action Bar Styles
  buttonContainer: { backgroundColor: 'rgba(0,0,0,0.7)', paddingVertical: 30, alignItems: 'center', justifyContent: 'center' },
  captureButton: { width: 74, height: 74, borderRadius: 37, borderWidth: 4, borderColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  innerCaptureButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#0CD964' },
  
  loadingBlock: { alignItems: 'center', gap: 8 },
  loadingText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  
  // Permission Layout Styles
  permissionText: { fontSize: 18, fontWeight: 'bold', color: '#213502', marginTop: 15, textAlign: 'center' },
  permissionSub: { fontSize: 13, color: '#557261', textAlign: 'center', marginTop: 6, paddingHorizontal: 20, lineHeight: 18 },
  permissionButton: { backgroundColor: '#213502', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginTop: 20 },
  permissionButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }
});