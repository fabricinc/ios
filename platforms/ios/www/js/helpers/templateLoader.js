 var templateLoader = {

    load: function(views, callback) {
        var deferreds = [];

        $.each(views, function(index, view) {
            deferreds.push($.get('templates/' + view + '.html', function(data) {
                APP.templates[view] = _.template(data);
            }, 'html'));
        });

        $.when.apply(null, deferreds).done(callback);
    }

};