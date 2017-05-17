"use strict";

let DecoderZip = function (decodedFrameBuffer) {
	let decoder = this;
	decoder.decodedFrameBuffer = decodedFrameBuffer;
	decoder.zip = new JSZip();
};

DecoderZip.prototype = {
	startLoad: function (url) {
		let decoder = this;
		decoder.src = url;
		let request = new XMLHttpRequest();
		request.open("get", url, true);
		request.responseType = "arraybuffer";
		decoder.decodedFrameBuffer.handleDecoderLoadStart();
		request.onprogress = function(event) {
			decoder.decodedFrameBuffer.handleDecoderLoadProgress(event);
		};
		request.onload = function(event) {
			let data = event.target.response;
			decoder.decodedFrameBuffer.handleDecoderDecodeStart();
			decoder.decompressZipData(data);
		};
		request.send();
		decoder.running = true;
	},
	decompressZipData: function (data) {
		let decoder = this;
		decoder.zip.loadAsync(data).then(function (zip) {
			console.log('zip:', zip);
			let imageNameList = [];
			for(let propertyName in zip.files){
				if(zip.files.hasOwnProperty(propertyName)){
					imageNameList.push(propertyName);
				}
			}
			imageNameList.sort();
			console.log();
			let nextIndex = 0;
			let getNextImage = function(){
				zip.files[imageNameList[nextIndex]]
					.async('base64')
					.then(function (base64) {
						decoder.imageDecompressCallback(base64);
						nextIndex++;
						if(nextIndex < imageNameList.length){
							setTimeout(getNextImage, 0);
						} else {
							decoder.zip = null;
						}
					});
			};
			getNextImage();
		});
	},
	imageDecompressCallback: function(base64){
		let decoder = this;
		let image = new Image();
		image.addEventListener('load', function () {
			decoder.decodedFrameBuffer.handleDecoderFrame(image);
		});
		image.src = 'data:image/jpg;base64,' + base64;
		decoder.stopDecodeTime = '' + decoder.decodedFrameBuffer.imageList.length + ':' + ((window.performance.now() - decoder.startDecodeTime) / 1000).toFixed(2);
	}
};
