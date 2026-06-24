// app/(spenderTabs)/scan.tsx
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StatusBar as NativeStatusBar,
  Platform,
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

  // 1. EVALUATE & REQUEST ACTIVE DEVICE CAMERA PERMISSIONS
  if (!permission) {
    return (
      <SafeAreaView style={[styles.fallbackContainer, styles.centerAlign]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="small" color="#0E2417" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.fallbackContainer, styles.centerAlign, { paddingHorizontal: 32 }]}>
        <StatusBar style="dark" />
        <View style={styles.permissionIconCircle}>
          <Ionicons name="camera-outline" size={32} color="#475569" />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionDescription}>
          To automatically scan and process transaction receipts with Payton, please grant camera permissions in your system choices.
        </Text>
        <TouchableOpacity style={styles.grantPermissionBtn} onPress={requestPermission}>
          <Text style={styles.grantPermissionBtnText}>Allow Camera Access</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 2. CONTROLLER TO HANDLE SNAPSHOT AND TRIGGER OCR ENGINE
  const handleTakePicture = async () => {
    if (cameraRef.current && !scanning) {
      try {
        setScanning(true);
        
        // Target high compression ratio to optimize base64 transmission network load
        const options = { quality: 0.5, base64: true, skipProcessing: false };
        const photo = await cameraRef.current.takePictureAsync(options);

        if (!photo.base64) {
          throw new Error("Unable to read valid image binary base64 data stream.");
        }

        // Prepare multi-part structural form parameters for OCR Space Engine API
        const formData = new FormData();
        formData.append('base64Image', `data:image/jpg;base64,${photo.base64}`);
        formData.append('language', 'eng');
        formData.append('isOverlayRequired', 'false');
        formData.append('filetype', 'JPG');

        const response = await fetch('https://api.ocr.space/parse/image', {
          method: 'POST',
          headers: {
            'apikey': 'helloworld', // Replace with a dedicated premium token key in production loops
          },
          body: formData,
        });

        const jsonResult = await response.json();
        
        if (jsonResult.OCRExitCode === 1) {
          const parsedText = jsonResult.ParsedResults[0].ParsedText;
          
          // Execute regex filter matching to parse merchant titles and high decimal balances
          const extractedInfo = parseReceiptText(parsedText);

          Alert.alert(
            "Scan Complete 🎉",
            `Merchant: ${extractedInfo.name}\nAmount: ₱${extractedInfo.amount.toFixed(2)}`,
            [
              {
                text: "Populate Form",
                onPress: () => {
                  router.push({
                    pathname: '/expenses',
                    params: { 
                      scannedName: extractedInfo.name, 
                      scannedAmount: extractedInfo.amount.toString() 
                    }
                  });
                }
              },
              { text: "Try Again", style: "cancel" }
            ]
          );
        } else {
          Alert.alert("Scan Failed ❌", "Text clarity is insufficient. Please position the invoice in a well-lit area and retry.");
        }

      } catch (error: any) {
        Alert.alert("OCR Engine Error", "An error occurred while parsing the text structures: " + error.message);
      } finally {
        setScanning(false);
      }
    }
  };

  // 3. REGEX PATTERN MATCHING ALGORITHM FOR RECEIPT VALUATION
  const parseReceiptText = (text: string): { name: string; amount: number } => {
    const lines = text.split('\n');
    let detectedAmount = 0.00;
    let detectedName = "Scanned Receipt";

    // Standardized expression capturing balance tokens and trailing float decimals
    const amountRegex = /(?:total|amount|due|cash|php|p|₱)\s*[:=]?\s*([\d,]+\.\d{2})/i;

    for (let line of lines) {
      const match = line.match(amountRegex);
      if (match) {
        const cleanAmount = match[1].replace(/,/g, '');
        const val = parseFloat(cleanAmount);
        if (val > detectedAmount) {
          detectedAmount = val; // Always prioritize the largest parsed transactional total
        }
      }
    }

    // Capture fallback descriptive tags from initial row if clear
    if (lines.length > 0 && lines[0].trim().length > 3) {
      detectedName = lines[0].trim().substring(0, 20); 
    }

    return { name: detectedName, amount: detectedAmount || 0 };
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Immersive Camera Interface Canvas */}
      <CameraView style={styles.camera} ref={cameraRef}>
        
        {/* Modern Clean Scanning Target Reticle Overlay */}
        <View style={styles.overlayContainer}>
          <View style={styles.safeTopHeaderSpacer}>
            <Text style={styles.instructionText}>Align receipt within the frame</Text>
          </View>

          <View style={styles.scanTargetBox} />

          <View style={styles.safeBottomHeaderSpacer}>
            <Text style={styles.subInstructionText}>Ensure text is bright, legible, and clear</Text>
          </View>
        </View>

        {/* Dynamic Context Control Trigger Pod */}
        <View style={styles.actionControlContainer}>
          {scanning ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.loadingText}>Analyzing receipt nodes...</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.outerCaptureRing} 
              onPress={handleTakePicture}
              activeOpacity={0.8}
            >
              <View style={styles.innerCaptureSolid} />
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  fallbackContainer: { flex: 1, backgroundColor: '#FAFBFD' },
  centerAlign: { justifyContent: 'center', alignItems: 'center' },
  camera: { flex: 1 },
  
  // Immersive Finder Mask
  overlayContainer: { 
    flex: 1, 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: 'rgba(15, 23, 42, 0.45)', // Rich slate cinematic shading tint
    paddingHorizontal: 24 
  },
  safeTopHeaderSpacer: { 
    marginTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight ? NativeStatusBar.currentHeight + 30 : 50 : 64, 
    alignItems: 'center' 
  },
  instructionText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '600', 
    textAlign: 'center',
    letterSpacing: -0.3
  },
  scanTargetBox: { 
    width: width * 0.78, 
    height: width * 1.15, 
    borderWidth: 2, 
    borderColor: '#10B981', // Clean modern Emerald green frame
    borderRadius: 24, 
    backgroundColor: 'transparent' 
  },
  safeBottomHeaderSpacer: { marginBottom: 175 },
  subInstructionText: { 
    color: '#94A3B8', 
    fontSize: 13, 
    textAlign: 'center', 
    fontWeight: '500' 
  },
  
  // Tactical Bottom Controls Bar
  actionControlContainer: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)', // Sleek blurred-dock appearance style
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  outerCaptureRing: { 
    width: 76, 
    height: 76, 
    borderRadius: 38, 
    borderWidth: 4, 
    borderColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  innerCaptureSolid: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: '#10B981' 
  },
  
  loadingBlock: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  loadingText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', letterSpacing: -0.1 },
  
  // Permission Core Layout System
  permissionIconCircle: { 
    width: 64, 
    height: 64, 
    borderRadius: 20, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  permissionTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', textAlign: 'center', letterSpacing: -0.4 },
  permissionDescription: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 22, fontWeight: '400' },
  grantPermissionBtn: { backgroundColor: '#1E293B', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 16, marginTop: 28 },
  grantPermissionBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 }
});