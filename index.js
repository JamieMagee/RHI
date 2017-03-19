function format(d) {
    var thead = '<thead>' +
        '<tr>' +
        '<th><strong>Date</strong></th>' +
        '<th><strong>Technology</strong></th>' +
        '<th><strong>Capacity</strong></th>' +
        '<th><strong>Payments</strong></th>' +
        '</tr>' +
        '</thead>';
    var tbody = '<tbody>';
    $.each(d['installations'], function (key, value) {
        tbody += '<tr><td>' +
            value['date'] +
            '</td><td>' +
            value['type'] +
            '</td><td>' +
            value['capacity'] +
            '</td><td>' +
            value['payments'] +
            '</td></tr>'
    });
    tbody += '</tbody>'
    return '<table class="display" cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">' + thead + tbody + '</table>'
}

var linkName = function (data, type, row) {
    if (type === 'sort' || typeof row.url === 'undefined') {
        return data;
    }
    return '<a href=\"' + row.url + '\" target=\"blank\">' +
        data +
        '</a>';
};

function drawChart() {
    var chartDiv = document.getElementById('chart');

    var margin = {top: 20, right: 20, bottom: 60, left: 50},
        width = chartDiv.clientWidth - margin.left - margin.right,
        height = (chartDiv.clientWidth / 1.5) - margin.top - margin.bottom;


    var parseTime = d3.timeParse('%d/%m/%Y');

    var x = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    x.range([0, width - margin.right]);

// Get the data
    d3.json('data/application_dates.json', function (error, data) {
        if (error) throw error;

        data.forEach(function (d) {
            d.date = parseTime(d.date);
            d.value = +d.value;
        });

        x.domain(d3.extent(data, function (d) {
            return d.date;
        }));
        y.domain([0, d3.max(data, function (d) {
            return d.value;
        })]);

        var domain = x.domain();
        var maxDay = new Date(domain[1]);
        maxDay.setDate(maxDay.getDate() + 1);
        var buckets = d3.timeDays(domain[0], maxDay);

        var newData = [];

        formatDate = d3.timeFormat('%d/%m/%Y');

        for (var i = 0; i < buckets.length; i++) {
            newData[i] = {};
            newData[i]['date'] = buckets[i];
            newData[i]['value'] = 0;

            for (var z = 0; z < data.length; z++) {
                var date1 = newData[i]['date'];
                var date2 = data[z]['date'];
                if (formatDate(date1) == formatDate(date2)) {
                    newData[i]['value'] = data[z]['value'];
                }
            }
        }

        var valueline = d3.line()
            .x(function (d) {
                return x(d.date);
            })
            .y(function (d) {
                return y(d.value);
            });

        var svg = d3.select('#chart')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        svg.append('path')
            .data([newData])
            .attr('class', 'line')
            .attr('d', valueline);

        // Add the X Axis
        svg.append('g')
            .attr('transform', 'translate(0,' + height + ')')
            .attr('class', 'x-axis')
            .call(d3.axisBottom(x));

        // Add the Y Axis
        svg.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y));

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Number of applications");

        svg.append("text")
            .attr("y", height + 40)
            .attr("x", width / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Date of application");
    });
}

var calcCompanyTotal = function (data, type, row) {
    var total = 0;
    $.each(row['installations'], function (key, value) {
        total += parseFloat(
            value['payments']
                .substring(1)
                .replace(',', '')
        );
    });
    if (type === 'sort') {
        return total;
    }
    return '£' + total
            .toFixed(2)
            .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

var countInstallations = function (data, type, row) {
    return row['installations'].length;
};

$(document).ready(function () {

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        if (!$('svg').length && $('ul.nav-tabs li.active').children('a').attr('href').indexOf('charts') != -1) {
            drawChart();
        }
        window.location.hash = e.target.hash;
        window.scrollTo(0, 0);
    });

    var url = document.location.toString();
    if (url.match('#')) {
        $('.nav-tabs a[href="#' + url.split('#')[1] + '"]').tab('show');
    }

    var table = $('#rhi').DataTable({
        ajax: function (data, callback, settings) {
            settings.sAjaxDataProp = '';
            $.getJSON(
                'data/rhi.json'
            ).done(function (data, textStatus, request) {
                callback(
                    data
                );
            })
        },
        columns: [
            {
                className: 'details-control',
                orderable: false,
                data: null,
                defaultContent: ''
            },
            {
                data: 'name',
                render: linkName
            },
            {
                data: null,
                render: countInstallations
            },
            {
                data: null,
                render: calcCompanyTotal
            }
        ],
        order: [1, 'asc'],
        responsive: true,
        autoWidth: true,
        pageLength: 25,
        initComplete: function (settings, json) {
            total = 0;
            $.each(json, function (key, value) {
                $.each(value['installations'], function (key, value) {
                    total += parseFloat(
                        value['payments']
                            .substring(1)
                            .replace(',', '')
                    );
                });
            });
            totalStr = '£' + total
                    .toFixed(2)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            $('#total').prepend(
                '<p>' + totalStr + '</p>'
            )
        }
    });


    $('#rhi').find('tbody').on('click', 'td.details-control', function () {
        var tr = $(this).closest('tr');
        var row = table.row(tr);

        if (row.child.isShown()) {
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            row.child(format(row.data())).show();
            tr.addClass('shown');
            tr.next('tr').find('table').DataTable({
                paging: false,
                searching: false,
                info: false
            })
        }
    });
});

$(window).resize(function () {
    if ($('svg').length) {
        $('svg').remove();
    }
    if ($('ul.nav-tabs li.active').children('a').attr('href').indexOf('charts') != -1) {
        drawChart();
    }
});
