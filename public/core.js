// public/core.js
var app = angular.module('Hydro', ['ngRoute', 'ngResource'], function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|magnet):/);
});


// configure our routes
app.config(function($routeProvider, $locationProvider) {
    $routeProvider

    // route for the home page
    .when('/', {
        templateUrl: 'search.html',
        controller: 'mainController'
    })

    // route for the about page
    .when('/watch', {
        templateUrl: 'watch.html',
        controller: 'watchController'
    })
    $locationProvider.html5Mode(true);

});


app.controller('mainController', function($scope, $http, $resource, $window, $route) {
    var Torrent = $resource('/torrent');
    var loaded = $resource('/loaded');
    $scope.formData = {};
    $scope.dis = false;
    $scope.torrents = {};



    $scope.$on('theatre', function() {
        $scope.bodyStyle = {
            background: "url('theatre.jpg') no-repeat center center fixed",
            "background-color": "black",
            "background-size": "cover"
        };

    });


    $scope.watch = function(uri) {

        Torrent.save({
            magnet: uri
        }); //Send a post to /torrents with the selected magnet uri
        loaded.get(function() {
            $window.location.href = '/watch';
        });
    }

    // when submitting the add form, send the text to the node API
    $scope.submitSearch = function() {

        $scope.error = '';
        if ($scope.formData.text != undefined) {
            $scope.dis = true;
            $http.get('/search', {
                params: {
                    keywords: $scope.formData.text,
                }
            })
                .success(function(data, status, headers, config) {

                    if (data.error) {
                        $scope.error = data.error;
                        $scope.dis = false;

                    } else
                        populateDescription(data.MovieList);


                })
                .error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                });
        }
    }




    function queryDesc(Imdbcode, i, res) {
        //  console.log("*********" + Imdbcode);
        $http.get('/description', {
            params: {
                i: Imdbcode
            }
        })
            .success(function(data, status, headers, config) {
                res({
                    'Plot': data.Plot,
                    'i': i
                });

            })
            .error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
    }



    function populateDescription(torrentData) {
        for (i = 0; i < torrentData.length; i++) {
            queryDesc(torrentData[i].ImdbCode, i, function(res) {
                if (res.Plot == undefined)
                    torrentData[res.i].Plot = "Not Available";
                else
                    torrentData[res.i].Plot = res.Plot;
            });

        }

        $scope.torrents = torrentData;
        $scope.dis = false;
    }


    //Setting HTTP Headers in https://docs.angularjs.org/api/ng/service/$http

});

app.controller('watchController', function($scope) {
    $scope.$emit('theatre');

});