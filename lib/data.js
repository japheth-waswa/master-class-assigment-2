/**
 * library for storing and editing data
 */


/**
 * dependencies
 */
var fs = require('fs');
var path = require('path');
var helpsers = require('./helpers');


/**
 * container for the module (to be exported)
 */
var lib = {};


/**
 * base directory of the data folder
 */
lib.baseDir = path.join(__dirname + '/../.data/');


/**
 * write data to a file
 * @param {*} dir 
 * @param {*} file 
 * @param {*} data 
 * @param {*} callback 
 */
lib.create = function (dir, file, data, callback) {

    //open the file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function (err, fileDescriptor) {

        if (!err && fileDescriptor) {

            //convert data to string
            var stringData = JSON.stringify(data);

            //write data to file and close
            fs.writeFile(fileDescriptor, stringData, function (err) {
                if (!err) {

                    //close file
                    fs.close(fileDescriptor, function (err) {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error closing new file');
                        }
                    });

                } else {
                    callback('Error writing to file');
                }
            });

        } else {
            callback('Could not create file,file may already exist');
        }

    });

}


/**
 * read data from file
 * @param {*} dir 
 * @param {*} file 
 * @param {*} callback 
 */
lib.read = function (dir, file, callback) {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', function (err, data) {

        if (!err && data) {
            var parseData = helpsers.parseJsonToObject(data);
            callback(false, parseData);
        } else {
            callback(err, data);
        }

    });
}


/**
 * update data in file
 * @param {*} dir 
 * @param {*} file 
 * @param {*} data 
 * @param {*} callback 
 */
lib.update = function (dir, file, data, callback) {

    //open file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function (err, fileDescriptor) {
        if (!err && fileDescriptor) {

            //truncate file
            fs.ftruncate(fileDescriptor, function (err) {

                if (!err) {

                    //convert data to string

                    var stringData = JSON.stringify(data);

                    //write to file
                    fs.writeFile(fileDescriptor, stringData, function (err) {

                        if (!err) {

                            //close file
                            fs.close(fileDescriptor, function (err) {

                                if (!err) {
                                    callback(false, 'Successfuly updated file');
                                } else {
                                    callback('Error closing file');
                                }

                            });

                        } else {
                            callback('Error updating file');
                        }

                    });

                } else {
                    callback('Error truncating file');
                }

            });

        } else {
            callback('Error opening file for update');
        }
    });

}


/**
 * delete file
 * @param {*} dir 
 * @param {*} file 
 * @param {*} callback 
 */
lib.delete = function (dir, file, callback) {

    //unlnk
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', function (err) {
        if (!err) {
            callback(false);
        } else {
            callback('Error deleting file');
        }
    });

}

/**
 * List files in specified directory
 * @param {*} dir 
 * @param {*} callback 
 */
lib.list = function (dir, callback) {
    fs.readdir(lib.baseDir + dir + '/', function (err, data) {
        if (!err && data && data.length > 0) {
            var trimmedFileNames = [];
            data.forEach(function (fileName) {
                trimmedFileNames.push(fileName.replace('.json', ''));
            });

            callback(false, trimmedFileNames)

        } else {
            callback(err, data);
        }
    });
}


/**
 * export the module
 */
module.exports = lib;