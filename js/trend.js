$(document).ready(function(){
    Highcharts.theme = {
        colors: ["#2b908f", "#90ee7e", "#f45b5b", "#7798BF", "#aaeeee", "#ff0066", "#eeaaee",
            "#55BF3B", "#DF5353", "#7798BF", "#aaeeee"],
        chart: {
            backgroundColor: {
                linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
                stops: [
                    [0, '#2a2a2b'],
                    [1, '#3e3e40']
                ]
            },
            style: {
                fontFamily: "'Arial', sans-serif"
            },
            plotBorderColor: '#606063'
        },
        title: {
            style: {
                color: '#E0E0E3',
                textTransform: 'uppercase',
                fontSize: '16px'
            }
        },
        subtitle: {
            style: {
                color: '#E0E0E3',
                textTransform: 'uppercase'
            }
        },
        xAxis: {
            gridLineColor: '#707073',
            labels: {
                style: {
                    color: '#E0E0E3'
                }
            },
            lineColor: '#707073',
            minorGridLineColor: '#505053',
            tickColor: '#707073',
            title: {
                style: {
                    color: '#A0A0A3'

                }
            }
        },
        yAxis: {
            gridLineColor: '#707073',
            labels: {
                style: {
                    color: '#E0E0E3'
                }
            },
            lineColor: '#707073',
            minorGridLineColor: '#505053',
            tickColor: '#707073',
            tickWidth: 1,
            title: {
                style: {
                    color: '#A0A0A3'
                }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            style: {
                color: '#F0F0F0'
            }
        },
        legend: {
            itemStyle: {
                color: '#E0E0E3'
            },
            itemHoverStyle: {
                color: '#FFF'
            },
            itemHiddenStyle: {
                color: '#606063'
            }
        },
        credits: {
            style: {
                color: '#666'
            }
        },
        labels: {
            style: {
                color: '#707073'
            }
        },

        drilldown: {
            activeAxisLabelStyle: {
                color: '#F0F0F3'
            },
            activeDataLabelStyle: {
                color: '#F0F0F3'
            }
        },

        navigation: {
            buttonOptions: {
                symbolStroke: '#DDDDDD',
                theme: {
                    fill: '#505053'
                }
            }
        },

        // scroll charts
        rangeSelector: {
            buttonTheme: {
                fill: '#505053',
                stroke: '#000000',
                style: {
                    color: '#CCC'
                },
                states: {
                    hover: {
                        fill: '#707073',
                        stroke: '#000000',
                        style: {
                            color: 'white'
                        }
                    },
                    select: {
                        fill: '#000003',
                        stroke: '#000000',
                        style: {
                            color: 'white'
                        }
                    }
                }
            },
            inputBoxBorderColor: '#505053',
            inputStyle: {
                backgroundColor: '#333',
                color: 'silver'
            },
            labelStyle: {
                color: 'silver'
            }
        },

        navigator: {
            handles: {
                backgroundColor: '#666',
                borderColor: '#AAA'
            },
            outlineColor: '#CCC',
            maskFill: 'rgba(255,255,255,0.1)',
            series: {
                color: '#7798BF',
                lineColor: '#A6C7ED'
            },
            xAxis: {
                gridLineColor: '#505053'
            }
        },

        scrollbar: {
            barBackgroundColor: '#808083',
            barBorderColor: '#808083',
            buttonArrowColor: '#CCC',
            buttonBackgroundColor: '#606063',
            buttonBorderColor: '#606063',
            rifleColor: '#FFF',
            trackBackgroundColor: '#404043',
            trackBorderColor: '#404043'
        },

        // special colors for some of the
        legendBackgroundColor: 'rgba(0, 0, 0, 0.5)',
        background2: '#505053',
        dataLabelsColor: '#B0B0B3',
        textColor: '#C0C0C0',
        contrastTextColor: '#F0F0F3',
        maskColor: 'rgba(255,255,255,0.3)'
    };
// Apply the theme
    Highcharts.setOptions(Highcharts.theme);
    var G_Setting = {
        global:{
            getTimezoneOffset:function () {
                var offset = new Date().getTimezoneOffset();
                return offset;
        }}
    };
    Highcharts.setOptions(G_Setting);
    Global.trend1Container = document.getElementById("trend_tube1");
    Global.trend2Container = document.getElementById("trend_tube2");
    Global.trend3Container = document.getElementById("trend_tube3");
    Global.trend4Container = document.getElementById("trend_tube4");
    var Trend_rt_setting1 = {
        credits:{enabled:false},
        chart: {
            //animation:false,
            height:250,
            renderTo:Global.trend1Container,            
        },
        title: {
            text: 'График давления в трубе 1'
        },
        legend: {
            enabled: false
        },
        xAxis: {
            type: 'datetime',
            ordinal:false,
        },
        yAxis: {
            //min:0,
            //max:16,
            minRange:3,
            title: {
                text: 'Давление'
            },
        },
        plotOptions: {
            series: {
                threshold:40
            },
            line:{
                marker:{
                    enabled:false
                },
            },
        },
        series:[{
            type: 'line',
            name: 'Давление в трубе 1',
            //data:[0,3,4,3,12,15,2],
            tooltip: {
                valueDecimals: 2,
                valueSuffix:' кг/см2'
            },
            color:"orange"
        }]
    };
    var Trend_rt_setting2 = {
        credits:{enabled:false},
        chart: {
            height:250,
            renderTo:Global.trend2Container,            
        },
        title: {
            text: 'График давления в трубе 2'
        },
        legend: {
            enabled: false
        },
        xAxis: {
            type: 'datetime',
            ordinal:false,
        },
        yAxis: {
            title: {
                text: 'Давление'
            },
	minRange:3,
        },
        plotOptions: {
            series: {
                threshold:40
            },
            line:{
                marker:{
                    enabled:false
                },
            },
        },
        series:[{
            type: 'line',
            name: 'Давление в трубе 2',
            //data:[0,3,4,3,12,15,2],
            tooltip: {
                valueDecimals: 2,
                valueSuffix:' кг/см2'
            },
            color:"orange"
        }]
    };
    var Trend_rt_setting3 = {
        credits:{enabled:false},
        chart: {
            height:250,
            renderTo:Global.trend3Container,            
        },
        title: {
            text: 'График давления в трубе 3'
        },
        legend: {
            enabled: false
        },
        xAxis: {
            type: 'datetime',
            ordinal:false,
        },
        yAxis: {
            title: {
                text: 'Давление'
            },
	minRange:3,
        },
        plotOptions: {
            series: {
                threshold:40
            },
            line:{
                marker:{
                    enabled:false
                },
            },
        },
        series:[{
            type: 'line',
            name: 'Давление в трубе 3',
            //data:[0,3,4,3,12,15,2],
            tooltip: {
                valueDecimals: 2,
                valueSuffix:' кг/см2'
            },
            color:"orange"
        }]
    };
    var Trend_rt_setting4 = {
        credits:{enabled:false},
        chart: {
            height:250,
            renderTo:Global.trend4Container,            
        },
        title: {
            text: 'График давления в трубе 4'
        },
        legend: {
            enabled: false
        },
        xAxis: {
            type: 'datetime',
            ordinal:false,
        },
        yAxis: {
            title: {
                text: 'Давление'
            },
	minRange:3,
        },
        plotOptions: {
            series: {
                threshold:40
            },
            line:{
                marker:{
                    enabled:false
                },
            },
        },
        series:[{
            type: 'line',
            name: 'Давление в трубе 4',
            //data:[0,3,4,3,12,15,2],
            tooltip: {
                valueDecimals: 2,
                valueSuffix:' кг/см2'
            },
            color:"orange"
        }]
    };
    Global.Trend1 = new Highcharts.Chart(Trend_rt_setting1);
    Global.Trend2 = new Highcharts.Chart(Trend_rt_setting2);
    Global.Trend3 = new Highcharts.Chart(Trend_rt_setting3);
    Global.Trend4 = new Highcharts.Chart(Trend_rt_setting4);
    console.log("test");
});
