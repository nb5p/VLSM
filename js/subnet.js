$(document).ready(function () {
    //确定按钮被按下
    $("#btn").click(function () {
        $(".title > div").css("visibility", "visible");
        $(".show").empty();
        var k = $("#getSubnetNum").val();
        for (var i = 0; i < k; i++) {
            $(".show").append($("<div class='col-lg-1 mt-1 mb-1'><input class='form-control' id='sub" + i + "'></div>"));
            $(".show").append($("<div class='col-lg-2 mt-1 mb-1'><span id='net" + i + "'></span></div>"));
            $(".show").append($("<div class='col-lg-2 mt-1 mb-1'><span id='mask" + i + "'></span></div>"));
            $(".show").append($("<div class='col-lg-1 mt-1 mb-1'><span id='perfix" + i + "'></span></div>"));
            $(".show").append($("<div class='col-lg-2 mt-1 mb-1'><span id='first" + i + "'></span></div>"));
            $(".show").append($("<div class='col-lg-2 mt-1 mb-1'><span id='last" + i + "'></span></div>"));
            $(".show").append($("<div class='col-lg-2 mt-1 mb-1'><span id='bc" + i + "'></span></div>"));
        };
         $("#btn").attr("disabled", true);
    })

    //提交按钮被按下
    $("#btnSubmit").click(function () {
        //读入网络地址和掩码
        var majorNetwork = readNetwork();

        if (validate.inputFields()) {
            majorNetwork = calc.createMajorNetwork(majorNetwork[0], majorNetwork[1]);
            if (validate.hosts(majorNetwork, readHosts())) {
                majorNetwork.setMinorNetworks(calc.createMinorNetworks(majorNetwork, readHosts()));
                printAllNetworks(majorNetwork);
                $("#getSubnetNum").val("子网个数：" + $("#getSubnetNum").val())
                $("#getIpAndAddress").val("网络地址/掩码：" + $("#getIpAndAddress").val())
                $("#getSubnetNum").attr("disabled", true);
                $("#getIpAndAddress").attr("disabled", true);
            }
            else {
                alert("网络空间不够分配主机");
                window.location.reload();
            }
        }
        else {
            alert("请检查输入的数据")
        }
    })

    //复位按钮被按下
    $("#btnClear").click(function () {
        //刷新网页
        window.location.reload()
    })
});

//IP地址位扩展
function extend(input) {
    return "00000000".substr(0, 8 - input.length) + input;
}

//读取网络地址和掩码
function readNetwork() {
    var ip, mask, ipAddr, ipAddress;
    var Mask = new Array(), network = new Array()
    ipAddr = "";

    //获取十进制的IP和掩码
    ip = $("#getIpAndAddress").val().split("/")[0].split(".");
    mask = $("#getIpAndAddress").val().split("/")[1];

    //IP转换成二进制数值数组
    for (var i = 0; i <= 3; i++) {
        ipAddr += extend(parseInt(ip[i]).toString(2));
    }
    ipAddress = ipAddr.split("").map((value) => {
        return parseInt(value);
    })

    //掩码转换成二进制数值数组
    for (var i = 0; i < mask; i++) {
        Mask.push(1);
    }
    for (var i = 0; i < 32 - mask; i++) {
        Mask.push(0);
    }

    //合并IP地址和掩码为一个network数组
    network.push(ipAddress, Mask);
    return network;
}

//读取主机个数
function readHosts() {
    var hosts = new Array();
    var biggestFirst = (a, b) => b - a;
    var k = $("#getSubnetNum").val();
    for (var i = 0; i < k; i++) {
        hosts.push($("#sub" + i).val());
    }
    var subnets = hosts.map(x => parseInt(x)).sort(biggestFirst);
    for (i = 0; i <= k; i++) {
        $("#sub" + i).val(subnets[i]);
        $("#sub" + i).attr("disabled", true);
    }
    return subnets;
}

function printAllNetworks(network) {
    network.minorNetworks.forEach(function (network) {
        printNetwork(network);
    });
    $("#btnSubmit").attr("disabled", true);
}

function printNetwork(network) {
    var k = $("#getSubnetNum").val();
    var wannaOutput;
    for (var i = 0; i <= k; i++) {
        if ($("#net" + i).html() == "") {
            wannaOutput = i;
            break;
        }
    }
    $("#net" + wannaOutput).html(network.networkToString());
    $("#mask" + wannaOutput).html(network.netmaskToString());
    $("#perfix" + wannaOutput).html(network.prefixToString());
    $("#first" + wannaOutput).html(network.firstHostToString());
    $("#last" + wannaOutput).html(network.lastHostToString());
    $("#bc" + wannaOutput).html(network.broadcastToString());
}

function Network(parameters) {
    this.netmask = parameters.netmask;
    this.network = calc.networkID(parameters.network, this.netmask);
    this.broadcast = calc.broadcast(this.network, this.netmask);
    this.firstHost = calc.firstHost(this.network);
    this.lastHost = calc.lastHost(this.broadcast);
}

Network.prototype.networkToString = function () {
    return convert.ipToDecimal(this.network);
};
Network.prototype.netmaskToString = function () {
    return convert.ipToDecimal(this.netmask);
};
Network.prototype.broadcastToString = function () {
    return convert.ipToDecimal(this.broadcast);
};
Network.prototype.firstHostToString = function () {
    return convert.ipToDecimal(this.firstHost);
};
Network.prototype.lastHostToString = function () {
    return convert.ipToDecimal(this.lastHost);
};
Network.prototype.numberOfHostsToString = function () {
    return calc.numberOfHosts(this.netmask);
};

Network.prototype.prefixToString = function () {
    return convert.maskToPrefix(this.netmask);
};


// 创建一个包含其他网络的网络类对象
function MajorNetwork(parameters) {
    Network.call(this, parameters);
    this.minorNetworks = [];
}

MajorNetwork.prototype = Object.create(Network.prototype);

MajorNetwork.prototype.constructor = MajorNetwork; // 重新构造

MajorNetwork.prototype.setMinorNetworks = function (minorNetworks) {
    this.minorNetworks = minorNetworks;
};

// 转换
var convert = (function () {
    //掩码转换为二进制
    var prefixToBinaryPriv = function (input) {
        var binaryMask = new Array(32);
        binaryMask.fill(0);
        binaryMask.fill(1, 0, input);
        return binaryMask;
    };

    //ip地址转换成二进制位
    var ipToBinaryPriv = function (input) {
        var ipAddress = input.split(".");
        // Convert number to 8-bit binary
        ipAddress = ipAddress.map(x => parseInt(x, 10).toString(2));
        ipAddress = ipAddress.map(x => "00000000" + x);
        ipAddress = ipAddress.map(x => x.slice(-8));
        // 4个8位数组变成32位数组
        ipAddress = ipAddress.reduce((accumulator, currentValue) => accumulator + currentValue);
        ipAddress = ipAddress.split("");
        // 字符串数组转成数字数组
        ipAddress = ipAddress.map(Number);
        return ipAddress;
    };

    //全0的ip地址
    var EMPTY_IP_ARR = new Array(4).fill(0);

    //ip地址转换成十进制
    var ipToDecimalPriv = function (input) {
        var sum = (a, b) => a + b;

        input = input.map(x => x.toString());
        return EMPTY_IP_ARR.map((x, i) => input.slice(i * 8, (i + 1) * 8).reduce(sum)) //8位一分割
            .map(x => parseInt(x, 2).toString(10))
            .join(".");
    };

    //掩码转换成前缀
    var maskToPrefix = function (netmask) {
        return netmask.filter(mask => mask === 1).length;//返回1的个数，过滤器删掉所有的非1元素
    };

    return {
        prefixToBinary: prefixToBinaryPriv,
        ipToBinary: ipToBinaryPriv,
        ipToDecimal: ipToDecimalPriv,
        maskToPrefix: maskToPrefix
    };
})();

// 计算
var calc = (function () {

    var firstHostPriv = function (network) {
        var firstHost = network.slice();//网络数组的副本
        firstHost[firstHost.length - 1] = 1;
        return firstHost;
    };

    var networkIDPriv = function (network, mask) {
        var hostBits = mask.filter(mask => mask === 0).length;
        var networkID = network.slice(0, network.length - hostBits);
        hostBits = new Array(hostBits).fill(0);
        networkID = networkID.concat(hostBits);
        return networkID;
    };

    //使用掩码计算广播地址
    var broadcastPriv = function (network, mask) {
        //把ip地址根据掩码切割，掩码是0的部分都填1，求出广播地址
        var hostBits = mask.filter(mask => mask === 0);
        hostBits = hostBits.length;
        var networkBits = mask.filter(mask => mask === 1);
        networkBits = networkBits.length;
        var broadcast = network.slice(0, networkBits);
        hostBits = new Array(hostBits).fill(1);
        // 合并数组
        broadcast = broadcast.concat(hostBits);
        return broadcast;
    };

    //该网络地址可行的最大主机数
    var numberOfHostsPriv = function (netmask) {
        var hosts = netmask.filter(x => (x === 0)).length;
        hosts = (Math.pow(2, hosts) - 2);
        return hosts;
    };

    //计算广播地址
    var lastHostPriv = function (broadcast) {
        var lastHost = broadcast.slice();
        lastHost[lastHost.length - 1] = 0;
        return lastHost;
    };

    //计算网络中主机数量所需要的位数，返回掩码
    var subnetRequiredPriv = function (hosts) {
        var hostBits = Math.ceil(Math.log2(parseInt(hosts) + 2));
        var requiredNetmask = new Array(32).fill(0);
        requiredNetmask = requiredNetmask.fill(1, 0, requiredNetmask.length - hostBits);
        return requiredNetmask; //子的
    };

    //二进制数组的数值+1
    var incrementBinaryPriv = function (bits) {
        bits = bits.join(""); //创建字符串
        var incremented = Number(parseInt(bits, 2)) + Number(parseInt(1, 2));
        incremented = parseInt(incremented, 10).toString(2);
        incremented = incremented.split("");
        incremented = incremented.map(Number);
        var prefix = new Array(bits.length - incremented.length).fill(0);
        incremented = prefix.concat(incremented);
        return incremented;
    };

    //根据主网络的网络地址和掩码还有要创建的子网的掩码，建立一个下一个子网网络对象
    var createNextNetwork = function (previousNetwork, previousNetmask, requiredMask) {
        previousNetmask = previousNetmask.filter(mask => mask === 1).length;
        var incrementedBits = previousNetwork.slice(0, previousNetmask); // 子网网络
        var newNetwork = calc.incrementBinary(incrementedBits); // 增长网络id
        newNetwork = newNetwork.concat(new Array(32 - previousNetmask).fill(0)); // 主机数
        var network = new Network({
            network: newNetwork,
            netmask: requiredMask
        });
        return network;
    };

    var createMajorNetwork = function (network, netmask) {
        var majorNetwork = new MajorNetwork({
            network: network,
            netmask: netmask
        });
        return majorNetwork;
    };

    // 创建第一个子网对象
    var createMinorNetworks = function (majorNetwork, subnets) {
        // 将第一个网络添加导数组中
        var minorNetworks = [];
        var minornetwork = calc.subnetRequired(subnets.splice(0, 1));
        var firstMinorNetwork = majorNetwork.network;
        firstMinorNetwork = new Network({
            network: majorNetwork.network,
            netmask: minornetwork
        });

        minorNetworks.push(firstMinorNetwork);

        // 根据前一个网络向一个数组中添加新的网络
        var pusher = function (element) {
            var minorNetwork = calc.createNextNetwork(
                minorNetworks.slice().pop().network,
                minorNetworks.slice().pop().netmask,
                calc.subnetRequired(element));
            minorNetworks.push(minorNetwork);
        };

        subnets.forEach(pusher);
        return minorNetworks;
    };

    return {
        networkID: networkIDPriv,
        firstHost: firstHostPriv,
        broadcast: broadcastPriv,
        lastHost: lastHostPriv,
        numberOfHosts: numberOfHostsPriv,
        subnetRequired: subnetRequiredPriv,
        incrementBinary: incrementBinaryPriv,
        createMajorNetwork: createMajorNetwork,
        createNextNetwork: createNextNetwork,
        createMinorNetworks: createMinorNetworks
    };
})();

//所有的验证都在这里
var validate = (function () {
    //验证输入的数据是否可行
    var hosts = function (majorNetwork, hosts) {
        hosts = hosts.map(x => calc.numberOfHosts(calc.subnetRequired(x)));
        var sum = (a, b) => a + b;
        hosts = hosts.reduce(sum);
        var maxHostsPossible = Number.parseInt(majorNetwork.numberOfHostsToString());
        if (hosts <= maxHostsPossible) {
            return true;
        }
        return false;
    };

    var ip = function (ip) {    //正则验证输入的网络地址
        var regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (regex.test(ip)) {
            return true;
        }
        return false;
    };

    //正则验证输入的掩码
    var prefix = function (prefix) {
        var regex = /^\d$|^[1,2]\d$|^3[0,2]$/;
        if (regex.test(prefix)) {
            return true;
        }
        return false;
    };

    //正则验证输入的主机个数
    var hostsString = function (hosts) {
        var regex = /^[0-9]+(,[0-9]+)*$/;
        if (regex.test(hosts)) {
            return true;
        }
        return false;
    };

    //验证数据
    var inputFields = function () {
        var network = $("#getIpAndAddress").val().split("/")[0];
        var netmask = $("#getIpAndAddress").val().split("/")[1];
        var hosts = "";
        var validations = true;

        //调用正则验证网络地址
        if (!validate.ip(network)) {
            validations = false;
        }

        //调用正则验证掩码
        if (!validate.prefix(netmask)) {
            validations = false;
        }

        //准备数据将主机个数合并到一起
        var k = $("#getSubnetNum").val();
        hosts = $("#sub0").val();
        for (var i = 1; i < k; i++) {
            hosts += "," + $("#sub" + i).val();
        }

        //调用正则验证组合后的主机数字符串
        if (!validate.hostsString(hosts)) {
            validations = false;
        }

        return validations;
    };

    return {
        hosts: hosts,
        prefix: prefix,
        ip: ip,
        hostsString: hostsString,
        inputFields: inputFields
    };
})();
