from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
from werkzeug.utils import secure_filename

# For soil image model
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array

app = Flask(__name__)

# Configure CORS properly
CORS(app, resources={
    r"/*": {
        "origins": ["http://127.0.0.1:5500", "http://localhost:5500", "http://127.0.0.1:5000", "http://localhost:5000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"]
    }
})

# Upload folder
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Load models
try:
    crop_model = joblib.load('models/crop_model.pkl')
    print("✓ Crop model loaded successfully")
except Exception as e:
    print(f"✗ Error loading crop model: {e}")
    crop_model = None

try:
    fertilizer_model = joblib.load('models/Ferti_model.pkl')
    print("✓ Fertilizer model loaded successfully")
except Exception as e:
    print(f"✗ Error loading fertilizer model: {e}")
    fertilizer_model = None

try:
    soil_model = load_model('models/soil_model.h5')
    print("✓ Soil model loaded successfully")
except Exception as e:
    print(f"✗ Error loading soil model: {e}")
    soil_model = None

soil_classes = ['Loamy', 'Alluvial', 'Sandy_Loam' , 'Sandy', 'Cinde' , 'Black' , 'Clay' ]

@app.route('/')
def home():
    return render_template('predict.html')

@app.route('/predict_crop', methods=['POST', 'OPTIONS'])
def predict_crop():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

    try:
        if crop_model is None:
            return jsonify({'error': 'Crop model not available'}), 500

        data = request.get_json(force=True)
        print("Crop prediction input received:", data)

        required_fields = ['nitrogen', 'phosphorus', 'potassium', 'temperature', 'humidity', 'ph', 'rainfall']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400

        input_data = np.array([[data['nitrogen'], data['phosphorus'], data['potassium'],
                                data['temperature'], data['humidity'], data['ph'],
                                data['rainfall']]])

        prediction = crop_model.predict(input_data)[0]
        print(f"Crop prediction result: {prediction}")

        # Fix: convert to native Python type
        response = jsonify({'prediction': str(prediction)})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

    except Exception as e:
        print(f"Error in crop prediction: {e}")
        response = jsonify({'error': str(e)})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500

@app.route('/predict_fertilizer', methods=['POST', 'OPTIONS'])
def predict_fertilizer():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

    try:
        if fertilizer_model is None:
            return jsonify({'error': 'Fertilizer model not available'}), 500

        data = request.get_json(force=True)
        print("Fertilizer prediction input received:", data)

        required_fields = ['nitrogen', 'phosphorus', 'potassium', 'temperature', 'humidity','ph','rainfall','soil_type','crop_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400

        input_data = np.array([[data['nitrogen'], data['phosphorus'], data['potassium'],
                                data['temperature'], data['humidity'],data['ph'],data['rainfall'],data['soil_type'],data['crop_type']]])

        prediction = fertilizer_model.predict(input_data)[0]
        print(f"Fertilizer prediction result: {prediction}")

        # Fix: convert to native Python type
        response = jsonify({'prediction': str(prediction)})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

    except Exception as e:
        print(f"Error in fertilizer prediction: {e}")
        response = jsonify({'error': str(e)})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500

@app.route('/predict_soil', methods=['POST'])
def predict_soil():
    try:
        if soil_model is None:
            return jsonify({'error': 'Soil model not available'}), 500

        if 'soilImage' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['soilImage']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Save file before processing
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        print(f"Saved soil image to: {filepath}")

        # Try loading the image
        try:
            image = load_img(filepath, target_size=(224, 224))
        except Exception as load_error:
            print("Error loading image:", load_error)
            return jsonify({'error': f'Invalid image file: {load_error}'}), 400

        image = img_to_array(image) / 255.0
        image = np.expand_dims(image, axis=0)

        prediction = soil_model.predict(image)
        predicted_class = soil_classes[np.argmax(prediction)]
        print(f"Prediction: {predicted_class}")

        os.remove(filepath)

        response = jsonify({'prediction': predicted_class})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

    except Exception as e:
        print("General error:", e)
        response = jsonify({'error': str(e)})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500


if __name__ == '__main__':
    print("🌱 Starting AgriTech Flask Server...")
    print("📊 Model Status:")
    print(f"   Crop Model: {'✓ Loaded' if crop_model else '✗ Not Available'}")
    print(f"   Fertilizer Model: {'✓ Loaded' if fertilizer_model else '✗ Not Available'}")
    print(f"   Soil Model: {'✓ Loaded' if soil_model else '✗ Not Available'}")
    print("\n🚀 Server starting on http://127.0.0.1:5000")
    print("📱 Frontend should be accessible at http://127.0.0.1:5000")
    print("🔧 API endpoints:")
    print("   - POST /predict_crop")
    print("   - POST /predict_fertilizer") 
    print("   - POST /predict_soil")
    print("   - GET /health")

    app.run(debug=True, host='127.0.0.1', port=5000)
