
module.exports = function(grunt) {
    'use strict';

    var base = ['<%= distDir %>', '<%= appDir %>', '.', '<%= coreDir %>'];

    return {
        options: {
            port: 9000,
            livereload: '<%= livereloadPort %>'
        },
        test: {
            options: {
                base: base,
                middleware: function(connect, options, middlewares) {
                    middlewares.unshift(mockTemplates);
                    return middlewares;

                    // avoid 404 in dev server for templates
                    function mockTemplates(req, res, next) {
                        if (req.url === '/templates-cache.js') {
                            // return empty cache module
                            return res.end('angular.module(\'superdesk.templates-cache\', []);');
                        } else {
                            return next();
                        }
                    }
                }
            }
        },
        travis: {
            options: {
                base: base,
                keepalive: true,
                livereload: false,
                port: 9000
            }
        },
        mock: {
            options: {
                base: base,
                keepalive: true,
                livereload: false,
                port: 9090
            }
        },
        build: {
            options: {
                base: ['<%= distDir %>'],
                port: 9090,
                livereload: false,
                keepalive: true
            }
        }
    };
};
