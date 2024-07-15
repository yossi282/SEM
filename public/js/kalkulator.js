function calculateFSL() {
    const frequency = document.getElementById('frequency').value;
    const distance = document.getElementById('distance').value;
    if (frequency && distance) {
        const fsl = 20 * Math.log10(distance) + 20 * Math.log10(frequency) + 92.45;
        document.getElementById('result').innerText = `FSL: ${fsl.toFixed(2)} dB`;
    } else {
        document.getElementById('result').innerText = 'Please enter valid values';
    }
}
