import subprocess

qcluster = None
runserver = None

try:
    # Start the Django Q cluster
    qcluster = subprocess.Popen(['python', 'manage.py', 'qcluster'])

    # Start the Django development server
    runserver = subprocess.Popen(['python', 'manage.py', 'runserver'])

    # Wait for both processes to finish
    qcluster.wait()
    runserver.wait()
except KeyboardInterrupt:
    print("\nShutting down...")
finally:
    # Terminate processes if they were started
    if qcluster is not None:
        qcluster.terminate()
    if runserver is not None:
        runserver.terminate()
