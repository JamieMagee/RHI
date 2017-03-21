function formatChildTable(d) {
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

function drawChart() {
    var jsonData = $.ajax({
        url: "data/application_dates.json",
        dataType: "json",
        async: false
    }).responseJSON;

    // Create our data table out of JSON data loaded from server.
    var data = new google.visualization.arrayToDataTable([
        [{type: 'date', label: 'date'}, {type: 'number', label: 'applications'}]
    ]);

    jsonData.forEach(function (value, index, array) {
        data.addRow([
            new Date(value.d * 1000),
            value.a
        ]);
    });

    // Instantiate and draw our chart, passing in some options.
    var chartDiv = document.getElementById('chart');
    var options = {
        height: chartDiv.clientWidth / 1.5,
        legend: 'none',
        vAxis: {
            title: 'Applications per week'
        },
        hAxis: {
            format: 'd MMM',
            title: 'Week beginning'
        },
        chartArea: {
            width: "85%",
            height: "85%"
        }
    };
    var chart = new google.visualization.LineChart(chartDiv);
    chart.draw(data, options);
}

$(document).ready(function () {

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
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
            row.child(formatChildTable(row.data())).show();
            tr.addClass('shown');
            tr.next('tr').find('table').DataTable({
                paging: false,
                searching: false,
                info: false
            })
        }
    });

    google.charts.load('current', {'packages': ['corechart']});
    google.charts.setOnLoadCallback(drawChart);

    window.addEventListener('resize', drawChart, true);


});
