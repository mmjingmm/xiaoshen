import { DEFAULT_WORDS_DATA } from './default_data.js';

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const csvFileInput = document.getElementById('csvFileInput');
    const fileNameDisplay = document.getElementById('fileName');
    const maxWordsInput = document.getElementById('maxWordsInput');
    const generateButton = document.getElementById('generateButton');
    const wordCloudCanvas = document.getElementById('wordCloudCanvas');
    const wordCloudContainer = document.querySelector('.wordcloud-container');
    const errorDisplay = document.getElementById('wordCloudError');
    const errorMessage = document.getElementById('errorMessage');

    document.getElementById('currentYear').textContent = new Date().getFullYear();

    let currentWordList = [];
    let currentProcessedWordList = []; // Store for regeneration

    function displayError(message) {
        errorMessage.textContent = message;
        errorDisplay.classList.remove('hidden');
    }

    function clearError() {
        errorDisplay.classList.add('hidden');
        errorMessage.textContent = '';
    }
    
    function parseCSVData(csvString) {
        const lines = csvString.trim().split(new RegExp('\\r\\n|\\n|\\r')); // Handles different line endings
        const data = [];
        if (lines.length === 0) return data;

        const headerLine = lines[0].toLowerCase();
        const hasHeader = (headerLine.includes('word') || headerLine.includes('词')) && (headerLine.includes('count') || headerLine.includes('频率'));
        
        const startIndex = hasHeader ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(',');
            if (parts.length >= 2) {
                const word = parts[0].trim();



                const count = parseInt(parts[1].trim(), 10);

                if (word && !isNaN(count) && count > 0) {
                    data.push([word, count]);
                }
            }
        }
        return data;
    }

    function processAndGenerateWordCloud(wordList) {
        clearError();
        if (!wordList || wordList.length === 0) {
            displayError('没有可用于生成词云的数据。请上传CSV文件或确保默认数据可用。');

            if (wordCloudCanvas.getContext) {
                 const ctx = wordCloudCanvas.getContext('2d');
                 ctx.clearRect(0, 0, wordCloudCanvas.width, wordCloudCanvas.height);
            }
            return;
        }
        currentProcessedWordList = [...wordList]; // Store the raw list for re-processing with different maxWords

        const maxWords = parseInt(maxWordsInput.value, 10) || 150;
        
        const sortedList = [...currentProcessedWordList]
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxWords);

        if (sortedList.length === 0) {
            displayError('筛选后没有词语可显示。请调整最大词数或检查数据。');
            return;
        }
        
        const containerWidth = wordCloudContainer.offsetWidth;
        const containerHeight = wordCloudContainer.offsetHeight;
        
        wordCloudCanvas.width = containerWidth;
        wordCloudCanvas.height = containerHeight;
        


        let minCount = Infinity, maxCount = -Infinity;
        sortedList.forEach(item => {
            if (item[1] < minCount) minCount = item[1];
            if (item[1] > maxCount) maxCount = item[1];
        });


        const countRange = Math.max(1, maxCount - minCount); 
        


        const baseGridSize = Math.max(2, Math.floor(12 * (600 / containerWidth)));


        WordCloud(wordCloudCanvas, {
            list: sortedList,
            gridSize: baseGridSize, 
            weightFactor: function (size) {



                return ( (size - minCount) / countRange * 30 ) + 5; // Linear scaling to a font size range
            },
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "PingFang SC", "Microsoft YaHei"',
            color: 'random-light',
            backgroundColor: 'transparent', // Using container background
            rotateRatio: 0.3,
            minSize: 2, // Smallest font size in pixels.
            shuffle: true,
            minRotation: -Math.PI / 6,
            maxRotation: Math.PI / 6,
            hover: (item, dimension, event) => {
                if (item) {
                    const el = event.target;
                    el.style.cursor = 'pointer';


                    el.title = `${item[0]}: ${item[1]}`; 
                }
            },
            click: (item, dimension, event) => {
                if (item) {
                    console.log(item[0] + ': ' + item[1]);


                }
            }
        });
    }

    csvFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            fileNameDisplay.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    currentWordList = parseCSVData(e.target.result);
                    if (currentWordList.length === 0 && file.size > 0) {
                         displayError('CSV文件解析后无有效数据，请检查文件格式是否为"词语,频率"且包含数据。');
                    } else if (currentWordList.length === 0 && file.size === 0) {
                         displayError('上传的CSV文件为空。');
                    }
                    else {
                        processAndGenerateWordCloud(currentWordList);
                    }
                } catch (error) {
                    console.error("Error parsing CSV:", error);
                    displayError(`解析CSV文件失败: ${error.message}`);
                    currentWordList = []; // Clear list on error
                    processAndGenerateWordCloud(currentWordList); // Attempt to clear/show error on canvas
                }
            };
            reader.onerror = () => {
                displayError('读取文件失败。');
                currentWordList = [];
                processAndGenerateWordCloud(currentWordList);
            };
            reader.readAsText(file, 'UTF-8'); // Specify UTF-8 for Chinese characters
        } else {
            fileNameDisplay.textContent = '选择文件...';
        }
    });

    generateButton.addEventListener('click', () => {



        if (currentProcessedWordList.length > 0) {
             processAndGenerateWordCloud(currentProcessedWordList);
        } else if (DEFAULT_WORDS_DATA.length > 0) { // Check if default data exists
             processAndGenerateWordCloud(DEFAULT_WORDS_DATA);
        } else {
            displayError('没有数据可供生成词云。请上传文件。');
        }
    });
    

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    const debouncedGenerate = debounce(() => {
        if (currentProcessedWordList.length > 0) {
            processAndGenerateWordCloud(currentProcessedWordList);
        } else if (DEFAULT_WORDS_DATA.length > 0) {
            processAndGenerateWordCloud(DEFAULT_WORDS_DATA); // Fallback to default if nothing else loaded yet
        }
    }, 300);


    window.addEventListener('resize', debouncedGenerate);


    currentWordList = DEFAULT_WORDS_DATA;
    currentProcessedWordList = DEFAULT_WORDS_DATA; // Initialize for regeneration
    if (currentWordList.length > 0) {
        processAndGenerateWordCloud(currentWordList);
    } else {
        displayError('默认词云数据未加载。请尝试上传CSV文件。');
    }
});






