# 💠 Mosaic - Unified Video Wall System

**Mosaic** is a powerful web-based video wall solution that transforms multiple devices into a single, unified display surface. It allows administrators to orchestrate video playback across a matrix of screens in real-time, perfect for digital signage, events, and immersive installations.

## ✨ Features

*   **Unified Video Wall**: Synchronize video playback across multiple devices (laptops, tablets, screens) to create a massive video wall.
*   **Real-time Control**: Admin dashboard for instant control over playback (Play, Pause, Seek, Stop) across all connected screens.
*   **Dynamic Matrix**: Drag-and-drop interface to assign screens to specific grid positions (rows/columns).
*   **Audio Routing**:
    *   **Broadcast**: Play audio on all screens.
    *   **Admin Preview**: Monitor audio locally on the admin device only.
    *   **Single Screen**: Route audio to a specific screen in the setup.
*   **Video Upload**: Upload local video files directly to the server or stream from URLs.
*   **Live Preview**: Real-time video preview on the admin dashboard with local monitoring support.
*   **Responsive Design**: Professional dark-themed UI built with Glassmorphism aesthetics.

<!-- ## 🛠️ Tech Stack

**Frontend:**
*   **React** (Vite)
*   **Socket.io Client**: Real-time bidirectional communication.
*   **CSS3**: Custom variables, Flexbox/Grid, and responsive styling.

**Backend:**
*   **Node.js & Express**: API and static file serving.
*   **Socket.io**: WebSocket server for handling screen connections and state synchronization.
*   **Multer**: Handling video file uploads. -->

## 📦 Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/shadan-pk/Mosaic.git
    cd Mosaic
    ```

2.  **Install Dependencies**
    This project requires dependencies for both the frontend and the backend.

    ```bash
    # Install dependencies
    npm install
    ```

## 🚀 Running the Application

To run the full system, you need to start both the backend server and the frontend development server.

1.  **Start the Backend Server**
    Open a terminal and run:
    ```bash
    npm run server
    ```
    *Server runs on port 3001 by default.*

2.  **Start the Client (Frontend)**
    Open a new terminal and run:
    ```bash
    npm run dev
    ```
    *Frontend runs on port 5173 (or similar).*

    > **Note:** To allow other devices on your network to connect, use:
    > ```bash
    > npm run dev -- --host
    > ```

## 📖 Usage Guide

1.  **Access the Admin Dashboard**:
    *   Go to `http://localhost:5173/admin` (or your local IP).
    *   Here you can configure the grid size (rows/columns) and upload videos.

2.  **Connect Client Screens**:
    *   On other devices (smart TVs, laptops, phones), open the app at `http://<YOUR_IP>:5173/client`.
    *   The screen will show "Waiting for Assignment".

3.  **Assign Screens**:
    *   In the Admin Dashboard, look at the **Unassigned Screens** list on the right.
    *   Drag and drop the screen cards into the **Matrix Grid** on the left to assign them a position.

4.  **Play Video**:
    *   Enter a video URL or upload a file.
    *   Press Play! The video will start synchronized across all devices.
    *   Use the "Monitor" toggle in the preview to check audio on the admin device without disturbing the display.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request :)

---

