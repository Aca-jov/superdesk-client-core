
'use strict';

describe('desks service', function() {
    var USER_URL = 'users/1';

    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('superdesk.templates-cache'));

    it('can fetch current user desks',
    inject(function(desks, session, api, preferencesService, $rootScope, $q) {
        spyOn(session, 'getIdentity').and.returnValue($q.when({_links: {self: {href: USER_URL}}}));
        spyOn(desks, 'fetchUserDesks').and.returnValue($q.when([{name: 'sport'}, {name: 'news'}]));
        spyOn(preferencesService, 'get').and.returnValue($q.when([]));
        spyOn(preferencesService, 'update');

        var userDesks;
        desks.fetchCurrentUserDesks().then(function(_userDesks) {
            userDesks = _userDesks;
        });

        $rootScope.$apply();

        expect(userDesks.length).toBe(2);
    }));

    it('can pick personal desk if user has no current desk selected',
        inject(function(desks, session, api, preferencesService, $q, $rootScope) {
            spyOn(preferencesService, 'get').and.returnValue($q.when('missing'));
            spyOn(preferencesService, 'update');
            spyOn(desks, 'fetchUserDesks').and.returnValue($q.when([]));
            desks.fetchCurrentUserDesks();
            $rootScope.$digest();
            expect(desks.getCurrentDeskId()).toBe(null);
            expect(preferencesService.update).not.toHaveBeenCalled();
        })
    );

    it('can checks if current desk is part of user desks, personal will be selected',
        inject(function(desks, session, api, preferencesService, $q, $rootScope) {
            spyOn(preferencesService, 'get').and.returnValue($q.when('missing'));
            spyOn(preferencesService, 'update');
            spyOn(desks, 'fetchUserDesks').and.returnValue($q.when({_items: []}));
            desks.fetchCurrentUserDesks();
            $rootScope.$digest();
            expect(desks.getCurrentDeskId()).toBe(null);
            expect(preferencesService.update).not.toHaveBeenCalled();
        })
    );

    it('can save desk changes', inject(function(desks, api, $q) {
        spyOn(api, 'save').and.returnValue($q.when({}));
        desks.save({}, {});
        expect(api.save).toHaveBeenCalledWith('desks', {}, {});
    }));

    it('can remove a desk', inject(function(desks, api, $q) {
        spyOn(api, 'remove').and.returnValue($q.when({}));
        desks.remove({});
        expect(api.remove).toHaveBeenCalledWith({});
    }));

    it('can change both desk and stage at same time', inject(function(desks, preferencesService, $q) {
        spyOn(preferencesService, 'update').and.returnValue($q.when({}));
        desks.setWorkspace(null);
        expect(preferencesService.update.calls.count()).toBe(0);
        desks.setWorkspace(null, null);
        expect(preferencesService.update.calls.count()).toBe(0);
        desks.setWorkspace('1');
        expect(preferencesService.update.calls.count()).toBe(1);
        desks.setWorkspace('1', null);
        expect(preferencesService.update.calls.count()).toBe(1);
        desks.setWorkspace('1', '1');
        expect(preferencesService.update.calls.count()).toBe(2);
        desks.setWorkspace('2', '1');
        expect(preferencesService.update.calls.count()).toBe(3);
    }));

    it('has active property with desk&stage', inject(function(desks, preferencesService) {
        var active = desks.active;
        spyOn(preferencesService, 'update');

        // change desk
        desks.setCurrentDeskId('desk');
        expect(desks.active.desk).toBe('desk');
        expect(desks.active.stage).toBe(null);
        expect(active).not.toBe(desks.active);

        // change stage
        active = desks.active;
        desks.setCurrentStageId('stage');
        expect(desks.active.desk).toBe('desk');
        expect(desks.active.stage).toBe('stage');
        expect(active).not.toBe(desks.active);

        // no change if set to same value
        active = desks.active;
        desks.setCurrentDeskId('desk');
        expect(active).toBe(desks.active);
        desks.setCurrentStageId('stage');
        expect(active).toBe(desks.active);
    }));

    it('can get stages for given desk', inject(function(desks, api, $q, $rootScope) {
        spyOn(api, 'query').and.returnValue($q.when({
            _items: [{desk: 'foo'}, {desk: 'bar'}],
            _links: {}
        }));

        var stages;
        desks.fetchDeskStages('foo').then(function(_stages) {
            stages = _stages;
        });

        $rootScope.$apply();
        expect(stages.length).toBe(1);
    }));

    describe('getCurrentDeskId() method', function() {
        var desks;

        beforeEach(inject(function(_desks_) {
            desks = _desks_;
        }));

        it('returns null if user desks list is empty', function() {
            var result;

            desks.userDesks = [];

            result = desks.getCurrentDeskId();
            expect(result).toBe(null);
        });
    });
});
