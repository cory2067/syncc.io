import rl
import lib601.poly as poly

from lib601.lti import *
from lib601.plotWindow import PlotWindow

def make_system_model(K):
    pass # Your code here

def view_root_locus():
    # make an instance of RootLocus and start the viewer with K = 0.01
    rl.RootLocus(make_system_model).view(0.01)

def stem_plot(response):
    PlotWindow().stem(range(len(response)), response)

def minimum_linear(f, x0, x1, threshold):
    pass # Your code here

def minimum_bisection(f, x0, x1, threshold):
    pass # Your code here
