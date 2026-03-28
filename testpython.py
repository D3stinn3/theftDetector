import cv2

SOURCE = "rtsp://admin:99infomart2035@192.168.100.3:554/ch25.264?ptype=tcp"
# if auth in URL fails, try without credentials:
# SOURCE = "rtsp://192.168.100.3:554/ch51.264?ptype=tcp"

cap = cv2.VideoCapture(SOURCE, cv2.CAP_FFMPEG)

while True:
    ret, frame = cap.read()
    if not ret:
        break
    cv2.imshow("cam", frame)
    if cv2.waitKey(1) == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()