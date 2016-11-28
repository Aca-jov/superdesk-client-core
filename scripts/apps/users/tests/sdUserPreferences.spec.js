'use strict';

describe('sdUserPreferences directive', function() {
    var fetchedPreferences,
        scope,
        $element;  // the root DOM element the directive operates on

    var user = {_id: 1};

    beforeEach(window.module('superdesk.apps.users'));
    beforeEach(window.module('superdesk.apps.authoring.metadata'));
    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('superdesk.core.filters'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.publish'));
    beforeEach(window.module('superdesk.apps.vocabularies'));

    beforeEach(inject(function(
        $rootScope, $compile, $q, metadata, preferencesService, session, userList, desks
    ) {
        var html = '<div sd-user-preferences data-user="user"></div>';

        // patch session service
        session.identity = {
            dateline_source: 'AAP'
        };

        // mock preferencesService's fetched data
        fetchedPreferences = {
            'dateline:located': {
                label: 'Located',
                category: 'article_defaults',
                located: null
            },
            'categories:preferred': {
                selected: {}
            },
            'desks:preferred': {
                selected: {}
            },
            'article:default:place': {
                label: 'Place',
                category: 'article_defaults',
                place: ''
            }
        };

        metadata.values = {
            categories: [
                {name: 'Domestic Sport', qcode: 't'},
                {name: 'Politics', qcode: 'p'}
            ],
            default_categories: [{qcode: 'x'}, {qcode: 'y'}]
        };

        spyOn(preferencesService, 'get').and.returnValue($q.when(fetchedPreferences));
        spyOn(userList, 'getUser').and.returnValue($q.when(user));
        spyOn(metadata, 'initialize').and.returnValue($q.when(metadata));
        spyOn(desks, 'initialize').and.returnValue($q.when(desks));

        // compile the directive and run it
        scope = $rootScope.$new(true);
        scope.user = user;
        $element = $compile(html)(scope);
        scope.$digest();
    }));

    it('initializes the list of categories in scope', function() {
        scope.$digest();

        expect(angular.equals(
            scope.categories,
            [
                {name: 'Domestic Sport', qcode: 't', selected: false},
                {name: 'Politics', qcode: 'p', selected: false}
            ]
        )).toBe(true);
    });

    it('initializes the list of default preferred categories in scope',
        function() {
            scope.$digest();
            expect(scope.defaultCategories).toEqual({x: true, y: true});
        }
    );

    describe('scope\'s save() method', function() {
        var modal,
            modalConfirm;  // deferred modal confirmation

        beforeEach(inject(function($q, _modal_, preferencesService) {
            var $newDiv;

            modal = _modal_;
            modalConfirm = $q.defer();
            spyOn(modal, 'confirm').and.returnValue(modalConfirm.promise);

            // some code part expects a textbox to be present (normally
            // generated by a sub-directive), thus we need to provide it
            $newDiv = $('<div class="input-term"><input type="text"/></div>');
            $element.find('[sd-typeahead]').append($newDiv);

            spyOn(preferencesService, 'update').and.returnValue($q.when(fetchedPreferences));
        }));

        it('sends the preferred categories settings to server', inject(function(preferencesService) {
            var arg,
                callArgs;

            scope.$digest();

            scope.categories = [
                {name: 'Advisories', qcode: 'v', selected: false},
                {name: 'Stockset', qcode: 'q', selected: true}
            ];

            scope.save();
            scope.$digest();  // to resolve internal promises

            // modal should not have been displayed with one category selected
            expect(modal.confirm).not.toHaveBeenCalled();

            callArgs = preferencesService.update.calls.allArgs();
            expect(callArgs.length).toEqual(1);
            callArgs = callArgs[0][0] || {};  // first arg of the first call

            arg = callArgs['categories:preferred'] || {};
            expect(arg.selected).toEqual({v: false, q: true});
        }));

        it('it saves default preferred categories if none selected and ' +
            'the user agrees', inject(function(preferencesService) {
                var arg,
                    callArgs;

                scope.$digest();

                scope.defaultCategories = {b: true, d: true};

                // no categories have been selected by the user
                scope.categories = [
                    {qcode: 'a', selected: false},
                    {qcode: 'b', selected: false},
                    {qcode: 'c', selected: false},
                    {qcode: 'd', selected: false}
                ];

                scope.save();
                modalConfirm.resolve();  // the user agrees
                scope.$digest();

                // modal should have been displayed
                expect(modal.confirm).toHaveBeenCalled();

                // check if the API was called and with what data
                callArgs = preferencesService.update.calls.allArgs();
                expect(callArgs.length).toEqual(1);
                callArgs = callArgs[0][0] || {};  // first arg of the first call

                arg = callArgs['categories:preferred'] || {};
                expect(arg.selected).toEqual(
                    {a: false, b: true, c: false, d: true}
                );
            }
        ));

        it('does not save with default preferred categories if the user ' +
            'does not confirm that', inject(function(preferencesService) {
                scope.$digest();
                scope.defaultCategories = {b: true, d: true};

                // no categories have been selected by the user
                scope.categories = [
                    {name: 'Advisories', qcode: 'v', selected: false},
                    {name: 'Stockset', qcode: 'q', selected: false}
                ];

                scope.save();
                modalConfirm.reject();  // the user disagrees
                scope.$digest();

                // modal should have been displayed
                expect(modal.confirm).toHaveBeenCalled();
                expect(preferencesService.update).not.toHaveBeenCalled();
            }
        ));
    });

    describe('scope\'s checkAll() method', function() {
        beforeEach(function() {
            scope.categories = [
                {qcode: '1', selected: false},
                {qcode: '2', selected: true},
                {qcode: '3', selected: false},
                {qcode: '4', selected: false}
            ];
        });

        it('marks all categories as selected', function() {
            scope.checkAll();
            scope.categories.forEach(function(cat) {
                expect(cat.selected).toBe(true);
            });
        });

        it('marks the form as dirty', function() {
            scope.userPrefs.$dirty = false;
            scope.checkAll();
            expect(scope.userPrefs.$dirty).toBe(true);
        });
    });

    describe('scope\'s checkNone() method', function() {
        beforeEach(function() {
            scope.categories = [
                {qcode: 'a', selected: true},
                {qcode: 'b', selected: true},
                {qcode: 'c', selected: false},
                {qcode: 'd', selected: true}
            ];
        });

        it('marks all categories as NOT selected', function() {
            scope.checkNone();
            scope.categories.forEach(function(cat) {
                expect(cat.selected).toBe(false);
            });
        });

        it('marks the form as dirty', function() {
            scope.userPrefs.$dirty = false;
            scope.checkNone();
            expect(scope.userPrefs.$dirty).toBe(true);
        });
    });

    describe('scope\'s checkDefault() method', function() {
        beforeEach(function() {
            scope.categories = [
                {qcode: 'a', selected: true},
                {qcode: 'b', selected: true},
                {qcode: 'c', selected: false},
                {qcode: 'd', selected: true}
            ];
            scope.defaultCategories = {};
        });

        it('makes only the default categories to be selected', function() {
            scope.defaultCategories = {b: true, c: true};
            scope.checkDefault();
            scope.categories.forEach(function(cat) {
                var expectSelected = _.includes(['b', 'c'], cat.qcode);
                expect(cat.selected).toBe(expectSelected);
            });
        });

        it('marks the form as dirty', function() {
            scope.userPrefs.$dirty = false;
            scope.checkDefault();
            expect(scope.userPrefs.$dirty).toBe(true);
        });
    });
});
