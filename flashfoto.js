var req = require('request'), fs = require('fs');
var base = 'http://flashfotoapi.com/api/';
var username = 'niusounds';
var apikey = 'ST8nRkjjPN8xESABCYOZlWkerCNhkwrI';
// http://flashfotoapi.com/api/get/2069373?partner_username=niusounds&partner_apikey=ST8nRkjjPN8xESABCYOZlWkerCNhkwrI&version=HardMasked
function generateFaceImage(filename, opts, cb) {
	console.log('generateFaceImage', opts);
	add(filename, opts, function(err, res, body) {
		console.log(body);
		if (err) {
			cb(err);
			return;
		}
		var id = body.Image.id;
		console.log('image id is ' + id);

		segment(id, function(err, res) {// '2069373' for sample
			if (err) {
				cb(err);
				return;
			}
			segmentStatus(id, function loop(err, res, status) {
				if (err) {
					cb(err);
					return;
				}

				console.log('segment status is ' + status.segmentation_status);
				if (status.segmentation_status === 'finished') {
					info(id, function(err, res, info) {
						if (err) {
							cb(err);
							return;
						}

						info.ImageVersion.forEach(function(ver) {
							if (ver.version === 'HardMasked') {
								console.log('face croped image found');
								get(ver, cb);
							}
						});
					});
				} else if (status.segmentation_status === 'failed') {
					cb('segmentation failed');
				} else {
					setTimeout(segmentStatus, 3000, id, loop);
				}
			});
		});
	});
}

function add(filename, opts, callback) {
	console.log('add', filename);
	fs.createReadStream(filename).pipe(req.post({
		url : base + 'add/',
		qs : {
			partner_username : username,
			partner_apikey : apikey,
			format : opts.format
		},
		json : true
	}, callback));
}

function segment(id, callback) {
	req.get({
		url : base + 'segment/' + id,
		json : true,
		qs : {
			partner_username : username,
			partner_apikey : apikey
		}
	}, callback);
}

function info(id, callback) {
	req.get({
		url : base + 'info/' + id,
		json : true,
		qs : {
			partner_username : username,
			partner_apikey : apikey
		}
	}, callback);
}

function get(ver, callback) {
	var id = ver.image_id || ver.id || ver;
	var qs = {
		partner_username : username,
		partner_apikey : apikey
	};

	if (ver.version) {
		qs.version = ver.version;
	}
	req.get({
		url : base + 'get/' + id,
		qs : qs,
		encoding : null
	}, callback);

}

function segmentStatus(id, callback) {
	req.get({
		url : base + 'segment_status/' + id,
		json : true,
		qs : {
			partner_username : username,
			partner_apikey : apikey
		}
	}, callback);
}

module.exports = {
	add : add,
	get : get,
	info : info,
	segment : segment,
	segmentStatus : segmentStatus,
	generateFaceImage : generateFaceImage
};
