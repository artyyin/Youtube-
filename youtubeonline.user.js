// ==UserScript==
// @name         Youtube直播在线人数记录
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  绘制直播过程中的在线人数变化曲线，支持下载数据或图片
// @author       You
// @match        https://www.youtube.com/watch?v=*

// @require      https://code.jquery.com/jquery-1.11.3.min.js
// @require      https://code.highcharts.com/highcharts.js
// @require      https://code.highcharts.com/modules/series-label.js
// @require      https://code.highcharts.com/modules/exporting.js
// @require      https://code.highcharts.com/modules/offline-exporting.js
// @require      https://code.highcharts.com/modules/export-data.js

// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// ==/UserScript==

(function() {
    //'use strict';
    var mainkey ="monkey-youtube-number-online-123456789"
    var debug_switch = false;
    var onlinedata =new Array()
    var chart;
    var aq_interval=5*1000;
    var n=0;
    var datakey ;
    var testdata = [
		[new Date(2018,7,16,23,49,4).getTime(),7296]
    ];
    //deleteAllKeys();
    //listAllKeys();
    setTimeout(delay_init, 5*1000);

    function delay_init()
    {
        if($('button.ytp-live-badge.ytp-button').length==0)
        {
            setTimeout(delay_init, 5*1000);
            console.log('wait 5s , retry to find button');
            return;
        }
        if($('button.ytp-live-badge.ytp-button').is(":visible")==false)
        {
            //alert("no live")
            n+=1;
            if(n<=4)
            {
                 setTimeout(delay_init, 5*1000);
                 console.log('wait 5s , retry to live state');
            }
            else
            {
                console.log('not live stream, exit');
            }
            return
        }
        datakey = ceateAndAddKey();
        add_chart_winnode()
        showchartwin()
        setTimeout(onTimer_2, aq_interval);
    }

    function loadHistoryData()
    {
        var url = document.URL;
        var alldatakey = GM_getValue(url)
        var result=[];
        for(var i in alldatakey)
        {
            var cur_data = GM_getValue(alldatakey[i]);
            result = result.concat(cur_data);
        }
        return result;
    }
    function getAbsoluteUrl(url){
        var a = document.createElement('A');
        a.href = url; // 设置相对路径给Image, 此时会发送出请求
        url = a.href; // 此时相对路径已经变成绝对路径
        return url;
    }
    function add_chart_winnode()
    {
        var windivnode =$('<div id="online_chartwin"></div>')
        windivnode.css({
            /*希望窗口有边框*/
            'border': '1px #0769ad solid',
            /*希望窗口宽度和高度固定，不要太大*/
            //'width': '500px',
            //'height': '300px',
            /*希望控制窗口的位置*/
            //'position': 'absolute',
            //'top': '100px',
            //'left': '350px',
            /*希望窗口开始时不可见*/
            'display': 'none'
        });
        var titledivnode = $('<div id="online_charttitle">在线人数记录</div>')
        titledivnode.css({
            /*控制标题栏的背景色*/
            'background-color': '#7cB5EC',
            /*控制标题栏中文字的颜色*/
            'color': 'white',
            /*控制标题栏的左内边距*/
            'padding-left':'3px'
        })
        var closebuttonnode = $('<span id="online_chartclose">[X]</span>')
        closebuttonnode.css({
            /*使关闭按钮向右侧移动*/
            //'position':'relative',
            'margin-right': '5px',
            //'right':'-10px',
            'float':'right',
            /*让鼠标进入时可以显示小手，告知用户可以点击操作*/
            'cursor': 'pointer'
        })
        closebuttonnode.click(onbuttonclick)
        var contentdivnode = $('<div id="online_chartcontent">窗口</div>')
        contentdivnode.css({
                'padding-left': '3px',
                'padding-top': '5px'
            })
        windivnode.append(titledivnode)
        windivnode.append(contentdivnode)
        titledivnode.append(closebuttonnode)
        $("#meta-contents").after(windivnode)
        addChart()
    }

    function addChart()
    {
        var hisdata = loadHistoryData();
        if(hisdata.length>0)
        {
            testdata = hisdata
        }
        console.log(testdata)

        Highcharts.setOptions({
            global: {
                useUTC: false
            }
        });
        console.log('addChart')
        chart = Highcharts.chart('online_chartcontent', {
            chart: {
                type: 'scatter',
                plotBorderWidth: 1,
                zoomType: 'x'
                   },
            title: {
                text: 'youtube直播在线人数--'+$('#owner-name > a').text()//document.title.substring(0,50)//'在线人数--youtube直播'
            },
            subtitle: {
                useHTML:true,
                text:getSubTitle()
            },
            xAxis: {
                dateTimeLabelFormats: {
                    millisecond: '%H:%M:%S.%L',
                    second: '%H:%M:%S',
                    minute: '%H:%M',
                    hour: '%H:%M',
                    day: '%Y-%m-%d',
                    week: '%m-%d',
                    month: '%Y-%m',
                    year: '%Y'
                },
                title: {
                    text: '时间'
                },
                type: 'datetime'
            },
            yAxis: {
                //min:0,
                title: {
                    text: '人数'
                }
            },
            legend:{enabled:false},
            tooltip: {
                headerFormat: '<b>时间：{point.x:%Y-%m-%d %H:%M:%S}</b><br>',
                pointFormat : '<b>人数： {point.y:.0f} 人</b>'
            },
            plotOptions: {
                scatter:{
                    lineWidth : 2,
                    marker: {radius: 1}
                }
            },
            series: [{
                name: '在线人数',
                data: hisdata
            }]
        });
        console.log('addCHart() end')
        if(hisdata.length==1)
        {
            chart.series[0].removePoint(0);
        }
        //console.log(chart.options.exporting.buttons.contextButton.menuItems)
    }
    function getSubTitle()
    {
        var s = $('#container > h1 > yt-formatted-string').text();
        if(s.length>50)
        {
            s = s.substring(0,30)+' ... '+s.substring(s.length-15);
        }
        return '<p align="center">'+s+'</p>'
    }
    function onbuttonclick()
    {
        var winNode = $("#online_chartcontent");
        if(winNode.is(":hidden"))
        {
            //winNode.show();
            winNode.fadeIn("slow");
        }
        else
        {
            //winNode.hide();
            winNode.fadeOut("slow");
        }
    }
    //显示曲线窗口
    function showchartwin() {
        //lert("准备显示弹出窗口啦！！！");
        //1.找到窗口对应的div节点
        var winNode = $("#online_chartwin");
        //2.让div对应的窗口显示出来
        //方法1,修改节点的css值，让窗口显示出来
        //winNode.css("display","block");
        //方法2，利用Jqeury的show方法
        //winNode.show("slow");
        //方法3，利用JQuery的fadeIn方法
        winNode.fadeIn("slow");
    }

    //定时采集数据
    function onTimer_2()
    {
        var point = getNumberOfOnline()
        var idx = onlinedata.length;
        chart.series[0].addPoint(point, true, false);
        //activeLastPointToolip(chart);
        onlinedata[idx] = point
        GM_setValue(datakey,onlinedata);
        setTimeout(onTimer_2, aq_interval);
    }
    function activeLastPointToolip(chart) {
        var points = chart.series[0].points;
        chart.tooltip.refresh(points[points.length -1]);
    }
    function getTestData()
    {
        var currentdate = new Date().getTime();
        var numofonline =5000+700*Math.sin(onlinedata.length/3.14) + Math.floor(Math.random()*700+1)
        var result =new Array()
        result[0]=currentdate
        result[1]=numofonline
        if(debug_switch)
        {
            var datestr = result[0]
            var logmsg = datestr+" | "+result[1]
            console.log(logmsg);
        }
        return result
    }
    //采集在线人数
    function getNumberOfOnline()
    {
        var currentdate = (new Date()).getTime();
        var elm = $("div[id=count]>yt-view-count-renderer>span:first")
        var numtext = elm.text()
        var numstr=/[0-9,]+/.exec(numtext).toString();
        var numofonline =parseInt(numstr.replace(',',''));
        if(debug_switch)
        {
            var logmsg = currentdate+" | "+numofonline+" | "+ numtext
            console.log(logmsg);
        }
        var result =new Array()
        result[0]=currentdate
        result[1]=numofonline
        return result
    }
    function listAllKeys()
    {
        var allkey = GM_listValues();
        for (var idx in allkey)
        {
            var data = GM_getValue(allkey[idx]);
            console.log(idx,allkey[idx]);
            console.log(data);
        }
    }
    function deleteAllKeys()
    {
        var allkey = GM_listValues();
        for (var idx in allkey)
        {
            GM_deleteValue(allkey[idx]);
        }
    }
    function clearAppKeys()
    {
        var allurl = GM_getValue(mainkey,[]);
        for (var u in allurl)
        {
            var url = allurl[u];
            var alldatakey = GM_getValue(url,[])
            for(var d in alldatakey)
            {
               GM_deleteValue(alldatakey[d])
            }
            GM_deleteValue(url)
        }
    }
    function ceateAndAddKey()
    {
        var allurl = GM_getValue(mainkey,[])
        var url = document.URL;
        if(!allurl.includes(url))
        {
            allurl[allurl.length] = url
            GM_setValue(mainkey,allurl)
        }
        var idx = url.indexOf('?v=')

        var timestr = new Date().toLocaleString();
        var dkey = url.substring(idx+3)+timestr
        var keyarray = GM_getValue(url,[])
        keyarray[keyarray.length]=dkey
        GM_setValue(url,keyarray)
        return dkey
    }
})();
