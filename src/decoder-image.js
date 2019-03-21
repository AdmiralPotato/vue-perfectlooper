"use strict";

let DecoderImage = function (decodedFrameBuffer) {
	let decoder = this;
	decoder.decodedFrameBuffer = decodedFrameBuffer;
	decoder.frameCount = decoder.decodedFrameBuffer.frameCount;
	decoder.framesLoaded = 0;
	decoder.images = [];
	decoder.loadHandler = (loadEvent) => {
		let image = loadEvent.target;
		image.loaded = true;
		decoder.framesLoaded += 1;
		requestAnimationFrame(() => {
			decoder.decodedFrameBuffer.handleDecoderFrame(
				image,
				image.frameIndex
			);
		});
	};
	decoder.errorHandler = (errorEvent) => {
		let image = errorEvent.target;
		if(image.loadAttemtps < decoder.maxFailures){
			setTimeout(() => {
				image.retry(image.loadAttemtps + 1);
			}, 100);
		}
	};
};

DecoderImage.prototype = {
	maxFailures: 10,
	startLoad (pathList) {
		let decoder = this;
		decoder.decodedFrameBuffer.handleDecoderLoadStart();
		pathList.forEach((src, frameIndex) => {
			let existingImage = decoder.images[frameIndex];
			let needsRestart = existingImage && !existingImage.loaded && existingImage.canceled;
			if(!existingImage){
				let getImage = (loadAttempts) => {
					let image = new Image();
					image.frameIndex = frameIndex;
					image.loaded = false;
					image.retry = getImage;
					image.loadAttemtps = loadAttempts;
					decoder.images[frameIndex] = image;
					image.addEventListener('load', decoder.loadHandler);
					image.addEventListener('error', decoder.errorHandler);
					image.src = src;
				};
				getImage(0);
			} else if(needsRestart) {
				existingImage.retry(0);
			}
		});
	},
	stopLoad () {
		let decoder = this;
		decoder.images.forEach((image) => {
			if(!image.loaded){
				image.canceled = true;
				image.removeEventListener('load', decoder.loadHandler);
				image.removeEventListener('error', decoder.errorHandler);
				image.src = '';
			}
		});
	}
};

export default DecoderImage;
