import cv2
import sys
from urllib.parse import quote


IP_ADDRESS = "192.168.100.134"
PORT = 554
USERNAME = "admin2"
PASSWORD = "qwerty123."
CHANNELS = range(1, 17)
SUBTYPES = (0, 1)
OPEN_TIMEOUT_MS = 5000
READ_ATTEMPTS = 30
SHOW_PREVIEW = "--show" in sys.argv


def build_rtsp_url(channel: int, subtype: int) -> str:
    encoded_password = quote(PASSWORD, safe="")
    return (
        f"rtsp://{USERNAME}:{encoded_password}@{IP_ADDRESS}:{PORT}"
        f"/cam/realmonitor?channel={channel}&subtype={subtype}"
    )


def test_stream(channel: int, subtype: int) -> bool:
    source = build_rtsp_url(channel, subtype)
    print(f"Testing channel={channel} subtype={subtype}")
    print(f"URL: {source}")

    cap = cv2.VideoCapture(source, cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, OPEN_TIMEOUT_MS)

    if not cap.isOpened():
        print("  Result: failed to open\n")
        cap.release()
        return False

    frame = None
    ok = False
    for _ in range(READ_ATTEMPTS):
        ok, frame = cap.read()
        if ok and frame is not None:
            break

    if not ok or frame is None:
        print("  Result: opened but could not read a frame\n")
        cap.release()
        return False

    height, width = frame.shape[:2]
    print(f"  Result: success ({width}x{height})\n")

    if SHOW_PREVIEW:
        window_name = f"Dahua ch{channel} subtype{subtype}"
        while True:
            cv2.imshow(window_name, frame)
            if cv2.waitKey(1) == ord("q"):
                break
            ok, next_frame = cap.read()
            if not ok or next_frame is None:
                break
            frame = next_frame
        cv2.destroyWindow(window_name)

    cap.release()
    return True


def main() -> int:
    successes = []
    print("Starting Dahua RTSP smoke test\n")

    for channel in CHANNELS:
        for subtype in SUBTYPES:
            if test_stream(channel, subtype):
                successes.append((channel, subtype, build_rtsp_url(channel, subtype)))

    print("Summary")
    if not successes:
        print("  No working Dahua RTSP streams were found.")
        return 1

    for channel, subtype, source in successes:
        stream_name = "main" if subtype == 0 else "sub"
        print(f"  Channel {channel} {stream_name} stream: {source}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
