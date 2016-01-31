
'use strict';

describe('superdesk.workspace.content', function() {

    beforeEach(module('superdesk.mocks'));
    beforeEach(module('superdesk.templates-cache'));
    beforeEach(module('superdesk.workspace.content'));

    describe('content service', function() {
        var done;
        var ITEM = {};

        beforeEach(inject(function(api, $q, preferencesService) {
            spyOn(api, 'save').and.returnValue($q.when(ITEM));
            done = jasmine.createSpy('done');
            spyOn(preferencesService, 'update').and.returnValue(true);
        }));

        it('can create plain text items', inject(function(api, content, $rootScope) {
            content.createItem().then(done);
            $rootScope.$digest();
            expect(api.save).toHaveBeenCalledWith('archive', {type: 'text', version: 0});
            expect(done).toHaveBeenCalledWith(ITEM);
        }));

        it('can create packages', inject(function(api, content, desks, session, $rootScope) {
            session.identity = {_id: '1'};
            desks.userDesks = {_items: []};
            spyOn(desks, 'getCurrentDesk')
                .and
                .returnValue({_id: '1', name: 'sport', working_stage: '2', incoming_stage: '3'});

            content.createPackageItem().then(done);
            $rootScope.$digest();
            expect(api.save).toHaveBeenCalledWith('archive', {headline: '', slugline: '',
                description: '', type: 'composite',
                groups: [{role: 'grpRole:NEP', refs: [{idRef: 'main'}], id: 'root'},
                {refs: [], id: 'main', role: 'grpRole:main'}], version: 0,
                task: {desk: '1', stage: '2', user: '1'}});
            expect(done).toHaveBeenCalledWith(ITEM);
        }));

        it('can create packages from items', inject(function(api, content, session, desks, $rootScope) {
            session.identity = {_id: '1'};

            spyOn(desks, 'getCurrentDesk')
                .and
                .returnValue({_id: '1', name: 'sport', working_stage: '2', incoming_stage: '3'});

            content.createPackageFromItems({data: 123}).then(done);
            $rootScope.$digest();
            expect(api.save).toHaveBeenCalledWith('archive', {
                headline: '', slugline: '',
                description: '',
                state: 'draft',
                type: 'composite',
                version: 0,
                task: {desk: '1', stage: '2', user: '1'},
                groups: [
                {role: 'grpRole:NEP', refs: [{idRef: 'main'}], id: 'root'},
                {refs: [{headline: '', residRef: undefined, location: 'archive',
                slugline: '', renditions: {}, itemClass: ''}],
                id: 'main', role: 'grpRole:main'}]});
        }));

        it('can create items from template', inject(function(api, content, desks, session, $rootScope) {
            session.identity = {_id: 'user:1'};

            spyOn(desks, 'getCurrentDesk')
                .and
                .returnValue({_id: '2', name: 'news', working_stage: '4', incoming_stage: '5'});

            content.createItemFromTemplate({
                _id: 'template1',
                data: {
                    slugline: 'test_slugline',
                    body_html: 'test_body_html',
                    irrelevantData: 'yes'
                }
            }).then(done);

            $rootScope.$digest();
            expect(done).toHaveBeenCalledWith(ITEM);
            expect(api.save).toHaveBeenCalledWith('archive', {
                slugline: 'test_slugline',
                body_html: 'test_body_html',
                task: {desk: '2', stage: '4', user: 'user:1'},
                template: 'template1',
                type: 'text',
                version: 0
            });
        }));
    });
});
